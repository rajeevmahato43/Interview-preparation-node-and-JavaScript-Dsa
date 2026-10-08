# Day 30: SQL Composition and Performance Awareness

<nav aria-label="Lecture navigation">

[Previous: Relational Correctness for APIs](day-29-relational-correctness-for-apis.md) | [Roadmap](../node-roadmap.md) | [Next: PostgreSQL Transactions, MVCC, and Locks](day-31-postgresql-transactions-mvcc-and-locks.md)

</nav>

## Prerequisites

- [Day 29: Relational Correctness for APIs](day-29-relational-correctness-for-apis.md) — Schema invariants, foreign keys, and safe zero-downtime indexing.
- [Day 28: Parameterized SQL CRUD](day-28-parameterized-sql-crud.md) — Parameter placeholders and dynamic query construction.
- [Day 24: MongoDB Aggregation and Index Awareness](day-24-mongodb-aggregation-and-index-awareness.md) — Index selectivity, ESR patterns, and query execution costs.
---

## Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                       LOGICAL VS PHYSICAL QUERY EXECUTION PHASES                            │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  LOGICAL QUERY EVALUATION ORDER                      PHYSICAL EXECUTION ENGINE (PostgreSQL CBO)
 ┌──────────────────────────────────────┐            ┌────────────────────────────────────────┐
 │ 1. FROM & JOIN                       │            │ Query Parser & Rewriter                │
 │    Identifies tables & combinations  │            │ (Constructs parse tree & expands views)│
 ├──────────────────────────────────────┤            └───────────────────┬────────────────────┘
 │ 2. WHERE                             │                                │
 │    Filters rows based on predicate   │                                ▼
 ├──────────────────────────────────────┤            ┌────────────────────────────────────────┐
 │ 3. GROUP BY                          │            │ Cost-Based Optimizer (CBO)             │
 │    Collapses rows into buckets       │            │ Evaluates pg_statistic distribution:   │
 │ 4. HAVING                            │            │ • Seq Scan vs Index Scan vs Bitmap Scan│
 │    Filters grouped buckets           │            │ • Nested Loop vs Hash Join vs Merge    │
 ├──────────────────────────────────────┤            └───────────────────┬────────────────────┘
 │ 5. SELECT                            │                                │
 │    Evaluates expressions & aliases   │                                ▼
 ├──────────────────────────────────────┤            ┌────────────────────────────────────────┐
 │ 6. DISTINCT                          │            │ Execution Engine Plan                  │
 │    Deduplicates projected rows       │            │ • Pulls data from Shared Buffer Cache  │
 ├──────────────────────────────────────┤            │ • Spills to Temp Disk if > work_mem    │
 │ 7. ORDER BY                          │            │ • Streams DataRow bytes to Node socket │
 │    Sorts final projected tuples      │            └────────────────────────────────────────┘
 ├──────────────────────────────────────┤
 │ 8. LIMIT & OFFSET                    │
 │    Paginates result window           │
 └──────────────────────────────────────┘
```

### 1. Logical vs Physical Query Execution

Logical execution order defines the conceptual sequence in which SQL operations evaluate data. Understanding this order explains why you cannot reference a column alias defined in `SELECT` within a `WHERE` clause: `WHERE` executes *before* `SELECT`.

However, PostgreSQL's **Cost-Based Optimizer (CBO)** does not mechanically execute operations in logical order. Instead, it reorders and transforms operations into a tree of physical execution nodes. For example, if a `LIMIT 1` is applied to an ordered query, the CBO will choose an index-driven backward scan that terminates immediately upon reading one tuple, rather than reading the entire table, sorting it, and discarding the remainder.

```sql
-- Logical Order Trace Example
SELECT 
  org_id, 
  COUNT(id) AS total_orders, 
  AVG(amount) AS avg_amount
FROM orders                          -- 1. Evaluates data source
WHERE created_at >= '2026-01-01'     -- 2. Filters raw tuples
GROUP BY org_id                      -- 3. Groups remaining tuples
HAVING COUNT(id) > 100               -- 4. Filters aggregated groups
ORDER BY avg_amount DESC             -- 5. Sorts the filtered groups
LIMIT 10;                            -- 6. Discards all but top 10
```

---

### 2. PostgreSQL Table Access Paths

When retrieving rows from a table, PostgreSQL chooses from four primary access paths based on table statistics, column selectivity, and available indexes:

| Access Path | Mechanism | When Optimizer Chooses It | Cost Characteristics |
|---|---|---|---|
| **Sequential Scan (`Seq Scan`)** | Reads every heap page of the table from start to finish sequentially. | Small tables ($< 1,000$ rows) or queries with low selectivity (fetching $> 15\%-20\%$ of all rows). | High I/O cost on large tables; optimal sequential disk read bandwidth. |
| **Index Scan** | Traverses a B-Tree index to locate row pointers (Tuple IDs: Block + Offset), then visits the heap page to retrieve tuple data. | Highly selective filters (fetching $< 5\%$ of table) or queries matching `ORDER BY` directly. | Low CPU/page cost for small matches; random I/O cost if heap pages are scattered. |
| **Index Only Scan** | Reads all requested data directly from the index. Uses the Visibility Map (VM) to confirm all tuples on the page are visible to all transactions. | Queries where **every** column in `SELECT` and `WHERE` exists in the index and table is vacuumed. | **Fastest access path**; zero heap page reads. |
| **Bitmap Index Scan** + **Bitmap Heap Scan** | Index scan constructs a bitmask of matching block pointers; Bitmap Heap Scan reads the blocks in physical disk order. | Queries returning $5\%-15\%$ of rows, or combining multiple independent indexes via `OR` / `AND`. | Eliminates random I/O by reading heap blocks sequentially; handles multi-index intersections. |

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          INDEX SCAN VS INDEX ONLY SCAN VISUALIZATION                        │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  1. INDEX SCAN (Heap Page Lookup Required):
  ┌─────────────────────────┐         ┌─────────────────────────┐
  │ B-Tree Index (email)    │         │ Table Heap Pages (Disk) │
  │ 'alice@corp' ───► TID ──┼────────►│ Block 42, Offset 3      │ ──► Fetches: (id, name, role)
  └─────────────────────────┘         └─────────────────────────┘      (Random I/O penalty)

  2. INDEX ONLY SCAN (Zero Heap Access):
  ┌──────────────────────────────────────────────┐
  │ Covering B-Tree Index (email) INCLUDE (role) │
  │ 'alice@corp', role='ADMIN'                   │ ──► Immediately returns: (email, role)
  └──────────────────────────────────────────────┘      (Checks Visibility Map; ZERO heap I/O)
```

---

### 3. Relational Join Algorithms and Memory Bounds

When combining rows from two tables (`Table A` and `Table B`), the PostgreSQL engine selects one of three core join algorithms:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                               POSTGRESQL JOIN STRATEGIES                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  1. NESTED LOOP JOIN:
     For each row in Outer Table A (e.g., 5 rows):
        Scan Index of Inner Table B for matching key
     ✓ Ideal for: Very small driving sets + indexed inner tables.

  2. HASH JOIN:
     Build in-memory Hash Table of Inner Table B (key -> row) using work_mem
     Stream Outer Table A and probe the Hash Table
     ✓ Ideal for: Medium-to-large unindexed sets. Spills to disk if hash table > work_mem!

  3. MERGE JOIN:
     Sort Table A by Join Key (or use index)
     Sort Table B by Join Key (or use index)
     Step through both pre-sorted streams in parallel like a zipper
     ✓ Ideal for: Large datasets already ordered by an existing B-Tree index.
```

#### The `work_mem` Hazard in Node.js Applications

`work_mem` specifies the amount of dedicated memory allocated to **each** internal sort operation or hash table before spilling to temporary disk files.
- The PostgreSQL default is conservative: `4MB`.
- If an API executes a query with `ORDER BY`, `DISTINCT`, or a `Hash Join` requiring 12MB of working space, the query will spill to disk:
  ```text
  Sort Method: external merge  Disk: 12480kB
  ```
- Disk-based sorting is **10 to 100 times slower** than in-memory quicksort.
- **Caution:** `work_mem` is allocated per-node, per-query. If 50 concurrent Node.js connections each execute a complex query with 3 join nodes, memory consumption scales as: $50 \times 3 \times \text{work\_mem}$. Setting `work_mem = '1GB'` globally will trigger out-of-memory (OOM) crashes on the database server. Set it strategically per session or transaction when needed:
  ```sql
  SET LOCAL work_mem = '64MB';
  ```

---

### 4. Eliminating the $N+1$ Query Problem in Node.js

The $N+1$ query problem occurs when an application executes 1 initial query to fetch a list of $N$ parent records, and subsequently executes $N$ individual child queries inside a loop over the network socket to retrieve related entities.

```javascript
// Node.js code
// anti-pattern: The catastrophic N+1 query problem
export async function getProjectsWithTasksUnsafe(pool, orgId) {
  // Query 1: Fetch 50 projects
  const { rows: projects } = await pool.query(
    'SELECT id, name FROM projects WHERE org_id = $1 LIMIT 50',
    [orgId]
  );

  // Queries 2 through 51: 50 sequential network round-trips!
  // Consumes 50 socket checkouts, adds 50 x 5ms network latency = 250ms minimum!
  for (const project of projects) {
    const { rows: tasks } = await pool.query(
      'SELECT id, title, status FROM tasks WHERE project_id = $1',
      [project.id]
    );
    project.tasks = tasks;
  }

  return projects;
}
```

#### The Standard JOIN Problem: Row Multiplication

If you attempt to fix $N+1$ with a standard SQL `LEFT JOIN`:
```sql
SELECT p.id, p.name, t.id AS task_id, t.title
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
WHERE p.org_id = $1;
```
If a project has 100 tasks, the project's metadata (`id`, `name`, descriptions) is duplicated across 100 distinct network rows. For large parent objects, this inflates wire payload size by 10x and forces Node.js to manually group and deduplicate arrays in memory.

#### The Senior Solution: Single-Roundtrip Database JSON Aggregation

PostgreSQL supports native relational aggregation using `json_build_object()` and `json_agg()`. This allows the database to aggregate one-to-many child relationships directly into JSON arrays within the engine, returning a clean, single-roundtrip dataset with zero row multiplication:

```javascript
// Node.js code
// pattern: Zero row-multiplication single roundtrip using json_agg
export async function getProjectsWithTasksSafe(pool, orgId) {
  const query = `
    SELECT 
      p.id,
      p.name,
      p.created_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', t.id,
            'title', t.title,
            'status', t.status
          ) ORDER BY t.created_at DESC
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'::json
      ) AS tasks
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id
    WHERE p.org_id = $1
    GROUP BY p.id, p.name, p.created_at
    ORDER BY p.created_at DESC
    LIMIT 50;
  `;

  // Exactly 1 network roundtrip!
  // node-postgres automatically deserializes the 'tasks' column into a native JS Array!
  const { rows } = await pool.query(query, [orgId]);
  return rows;
}
```

---

### 5. Multi-Column Indexes and the ESR Rule

When designing composite B-Tree indexes (`CREATE INDEX idx ON tbl (colA, colB, colC)`), column order is critical. A composite index is sorted hierarchically: first by `colA`, then within identical values of `colA` by `colB`, and so forth.

Follow the **ESR Rule (Equality, Sort, Range)** when selecting column order:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            THE ESR RULE FOR COMPOSITE INDEXES                               │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  1. EQUALITY (=) Columns FIRST:
     Narrow down the index search space to an exact contiguous slice.
     Example: tenant_id = $1 AND status = 'ACTIVE'

  2. SORT (ORDER BY) Columns SECOND:
     If rows in that slice are already ordered by the target sort column,
     PostgreSQL avoids an expensive in-memory / disk sort entirely!
     Example: ORDER BY created_at DESC

  3. RANGE (<, >, BETWEEN) Columns LAST:
     Once a range filter is encountered, the B-Tree can no longer perform
     exact key seeks on subsequent index columns.
     Example: AND amount >= 100
```

#### Covering Indexes with the `INCLUDE` Clause

A covering index includes additional payload columns that are not part of the search key, allowing the optimizer to perform an **Index Only Scan**:

```sql
CREATE INDEX idx_orders_covering 
ON orders (customer_id, created_at DESC) 
INCLUDE (total_amount, status);
```
- **Key Columns (`customer_id`, `created_at`):** Used for B-Tree index traversal and sorting.
- **Payload Columns (`total_amount`, `status`):** Appended to the leaf nodes of the B-Tree. They do not increase the depth of the search tree, but allow queries projecting these columns to satisfy the entire query directly from the index without reading table heap blocks.

---

## Detailed Explanations and Traces

### Anatomy of an `EXPLAIN (ANALYZE, BUFFERS)` Output

> **`EXPLAIN (ANALYZE, BUFFERS)`**: An execution command that actually runs a SQL query and measures true elapsed wall time, memory usage, and shared buffer page hits vs disk reads.

To diagnose database latency in production, run `EXPLAIN (ANALYZE, BUFFERS)` on the target statement:

```sql
EXPLAIN (ANALYZE, BUFFERS, COSTS, VERBOSE)
SELECT customer_id, total_amount 
FROM orders 
WHERE status = 'PENDING' AND created_at >= '2026-01-01'
ORDER BY created_at DESC 
LIMIT 20;
```

#### Annotated Execution Plan Breakdown

```text
Limit  (cost=125.40..125.45 rows=20 width=24) (actual time=4.120..4.125 rows=20 loops=1)
  Buffers: shared hit=42 read=5
  ->  Sort  (cost=125.40..127.80 rows=960 width=24) (actual time=4.118..4.121 rows=20 loops=1)
        Sort Key: created_at DESC
        Sort Method: quicksort  Memory: 35kB
        Buffers: shared hit=42 read=5
        ->  Bitmap Heap Scan on orders  (cost=14.20..98.50 rows=960 width=24) (actual time=0.850..3.200 rows=960 loops=1)
              Recheck Cond: (status = 'PENDING'::text AND created_at >= '2026-01-01'::timestamptz)
              Buffers: shared hit=40 read=5
              ->  Bitmap Index Scan on idx_orders_status_created  (cost=0.00..13.96 rows=960 width=0) (actual time=0.450..0.450 rows=960 loops=1)
                    Index Cond: (status = 'PENDING'::text AND created_at >= '2026-01-01'::timestamptz)
                    Buffers: shared hit=2
Planning Time: 0.185 ms
Execution Time: 4.180 ms
```

#### Metrics to Inspect

1. **`shared hit` vs `shared read`:**
   - `shared hit=42`: 42 pages ($42 \times 8\text{KB} = 336\text{KB}$) were found in PostgreSQL's RAM buffer pool (`shared_buffers`).
   - `shared read=5`: 5 pages were not in cache and had to be read from OS cache or physical disk storage. High `read` numbers indicate cache misses and explain I/O latency spikes.
2. **`Sort Method`:**
   - `quicksort Memory: 35kB` $\to$ The entire sort completed inside RAM because the data size was less than `work_mem`.
   - If it says `external merge Disk: ...`, you must either increase `work_mem` or add an index that matches the `ORDER BY` clause to avoid sorting altogether.
3. **`actual rows` vs Estimated `rows`:**
   - Estimated `rows=960`, actual `rows=960`. When estimated and actual counts match closely, table statistics are accurate. If the estimate is 1 row but actual is 500,000, table statistics are stale; run `ANALYZE orders;` to refresh the planner's histograms.

---

## Common Mistakes and Interview Traps

### 1. Functional / Expression Disqualification

Applying a SQL function or transformation to an indexed column in the `WHERE` clause **invalidates standard B-Tree index lookups**:

```sql
-- ❌ DISQUALIFIES B-TREE INDEX on (created_at):
-- PostgreSQL cannot use the index because DATE() must be evaluated on every row!
SELECT * FROM logs WHERE DATE(created_at) = '2026-03-01';

-- ✅ USES B-TREE INDEX on (created_at):
-- Keeps the column naked and passes a range bounds parameter:
SELECT * FROM logs 
WHERE created_at >= '2026-03-01 00:00:00Z' 
  AND created_at <  '2026-03-02 00:00:00Z';
```

If you must query by a computed expression (such as case-insensitive email searches), define an explicit **Expression Index**:
```sql
CREATE INDEX idx_users_lower_email ON users (LOWER(email));
```

### 2. High Offset Pagination Pitfall

Using `OFFSET 100000 LIMIT 20` forces PostgreSQL to scan 100,020 tuples from the index or heap, sort them, and discard the first 100,000 before returning 20 rows. Latency scales linearly with page depth ($O(N)$). Senior engineers use **Keyset Cursor Pagination** (`WHERE id < $last_seen_id ORDER BY id DESC LIMIT 20`), which performs a constant-time $O(\log N)$ B-Tree index seek.

---

## Tricky Points and Edge Cases

### 1. Indexing Low-Cardinality Columns (Boolean & Status Flags)

Creating a standalone B-Tree index on a boolean column (e.g., `is_active BOOLEAN`) or a low-cardinality status enum (`status VARCHAR` with 3 values) is often completely ignored by the query planner. If 95% of rows have `is_active = true`, scanning the index and then fetching 95% of random heap blocks costs more than a simple sequential table scan.
- **The Optimization:** Use a **Partial Index** for the rare value:
  ```sql
  -- Indexes only the 5% of records that are pending:
  CREATE INDEX idx_orders_pending ON orders (created_at) WHERE status = 'PENDING';
  ```

---

## Hands-On Exercise: Optimizing an E-Commerce Analytics Endpoint

### Scenario

You are investigating an Express API endpoint `GET /api/v1/merchants/:merchantId/recent-orders`. Under peak load, this endpoint causes 100% CPU utilization on the database and response times degrade to 1,500ms.

Investigation reveals:
1. The repository executes an unoptimized query joining `orders` and `order_items`. It causes row duplication and memory bloat.
2. The query filters on `merchant_id` and `created_at`, but the existing index is only on `(created_at)`.
3. The sort operation spills to disk due to inadequate index support.
4. The client requires a nested payload: each order must contain an array of its purchased items.

### Buggy Code

```javascript
// Node.js code
export async function getRecentOrdersBuggy(pool, merchantId) {
  // BUG: Flawed join causes massive row multiplication!
  // If an order has 10 items, the order columns are duplicated 10 times.
  // Node.js is forced to reconstruct the nested object in JavaScript memory.
  const query = `
    SELECT 
      o.id AS order_id,
      o.customer_name,
      o.total_cents,
      o.created_at,
      i.id AS item_id,
      i.product_name,
      i.quantity,
      i.price_cents
    FROM orders o
    LEFT JOIN order_items i ON i.order_id = o.id
    WHERE o.merchant_id = $1 
      AND o.created_at >= NOW() - INTERVAL '30 days'
    ORDER BY o.created_at DESC;
  `;

  const { rows } = await pool.query(query, [merchantId]);

  // Expensive in-memory manual grouping loop in Node.js heap
  const orderMap = new Map();
  for (const row of rows) {
    if (!orderMap.has(row.order_id)) {
      orderMap.set(row.order_id, {
        id: row.order_id,
        customerName: row.customer_name,
        totalCents: row.total_cents,
        createdAt: row.created_at,
        items: []
      });
    }
    if (row.item_id) {
      orderMap.get(row.order_id).items.push({
        id: row.item_id,
        productName: row.product_name,
        quantity: row.quantity,
        priceCents: row.price_cents
      });
    }
  }

  return Array.from(orderMap.values());
}
```

### Acceptance Criteria

1. Provide an optimized composite B-Tree index definition adhering to the ESR rule and covering index concepts.
2. Rewrite the SQL query using `json_agg` and `json_build_object` to perform aggregation directly in PostgreSQL, eliminating row duplication and Node.js heap reconstruction loops.
3. Apply keyset or limit bounds to guarantee sub-15ms response times.
4. Verify using `EXPLAIN (ANALYZE, BUFFERS)` that the query eliminates disk sorts and executes an index-driven scan.

### Solution SQL DDL & Indexing

```sql
-- Safe production index addition
-- Follows ESR Rule:
-- Equality: merchant_id
-- Sort: created_at DESC
-- Covering Include: customer_name, total_cents
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_merchant_created_covering
ON orders (merchant_id, created_at DESC)
INCLUDE (customer_name, total_cents);

-- Foreign key index on child table for fast join resolution
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_order_id
ON order_items (order_id);
```

### Solution Code

```javascript
// Node.js code
export async function getRecentOrdersOptimized(pool, merchantId, limit = 50) {
  // Single roundtrip, native JSON aggregation, zero row multiplication
  const query = `
    SELECT 
      o.id,
      o.customer_name AS "customerName",
      o.total_cents AS "totalCents",
      o.created_at AS "createdAt",
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', i.id,
              'productName', i.product_name,
              'quantity', i.quantity,
              'priceCents', i.price_cents
            )
          )
          FROM order_items i
          WHERE i.order_id = o.id
        ),
        '[]'::json
      ) AS items
    FROM orders o
    WHERE o.merchant_id = $1
      AND o.created_at >= NOW() - INTERVAL '30 days'
    ORDER BY o.created_at DESC
    LIMIT $2;
  `;

  // PostgreSQL evaluates child items per selected order tuple,
  // avoiding Cartesian row explosion over the wire.
  const { rows } = await pool.query(query, [merchantId, limit]);
  return rows;
}
```

### Solution Explanation

1. **Covering ESR Index:** The index `(merchant_id, created_at DESC) INCLUDE (customer_name, total_cents)` satisfies the equality filter on `merchant_id` and the sort requirement on `created_at DESC` simultaneously. PostgreSQL avoids in-memory sorting completely. Furthermore, because `customer_name` and `total_cents` are stored in the leaf nodes, PostgreSQL minimizes heap page access.
2. **Correlated Subquery JSON Aggregation:** Using a scalar correlated subquery `(SELECT json_agg(...) FROM order_items WHERE i.order_id = o.id)` evaluates child line items **only for the 50 orders returned by the paginated outer query**. This is dramatically faster than performing a global `LEFT JOIN` on millions of rows before grouping and applying `LIMIT`.
3. **Elimination of Node.js CPU Overhead:** The Node.js process receives pre-structured, ready-to-serialize JSON objects directly from `node-postgres`. The expensive JavaScript `Map` grouping loop is eliminated, reducing garbage collection pressure on the Node event loop.

---

## Summary

- Logical query evaluation order (`FROM` $\to$ `WHERE` $\to$ `GROUP BY` $\to$ `SELECT` $\to$ `ORDER BY`) defines semantics, while the Cost-Based Optimizer (CBO) determines physical access paths and join algorithms based on statistics.
- Use `EXPLAIN (ANALYZE, BUFFERS)` to profile queries. Check for `shared read` (disk I/O) vs `shared hit` (cache hits) and identify whether sorts execute via in-memory `quicksort` or spill to disk as `external merge`.
- PostgreSQL access paths include `Seq Scan`, `Index Scan`, `Bitmap Heap Scan`, and `Index Only Scan` (the fastest access path, which completely avoids table heap fetches).
- Join algorithms comprise `Nested Loop` (small driving tables with indexed lookups), `Hash Join` (medium-to-large unindexed tables), and `Merge Join` (pre-sorted streams).
- The $N+1$ query problem causes severe connection pool exhaustion and latency degradation. Solve it using relational joins and database-side JSON aggregation (`json_agg`, `json_build_object`).
- Design composite B-Tree indexes using the **ESR Rule (Equality, Sort, Range)** and leverage `INCLUDE` clauses to create covering indexes.

---

## Cheat Sheet

| Concern | Pattern / Command | Operational Advantage |
|---|---|---|
| **Query Profiling** | `EXPLAIN (ANALYZE, BUFFERS) SELECT ...` | Reveals real execution time, buffer cache hits, and physical scans |
| **Index Only Scan** | `CREATE INDEX ... ON tbl (a) INCLUDE (b, c);` | Resolves query entirely from index leaf nodes without touching heap |
| **Avoid N+1** | `json_agg(json_build_object(...))` | Bundles one-to-many child arrays in a single query roundtrip |
| **ESR Index Rule** | `(equality_col, order_by_col, range_col)` | Maximizes index selectivity and eliminates runtime sort operations |
| **Prevent Disk Sort** | Increase `SET LOCAL work_mem = '32MB'` | Keeps sorting in RAM; prevents temporary disk file creation |
| **Expression Index** | `CREATE INDEX ... ON tbl (LOWER(email));` | Enables index seeks when queries use functional transformations |
| **Selective Flag** | `CREATE INDEX ... ON tbl (id) WHERE status = 'ERR'` | Partial index; reduces index size by 95% on skewed distributions |
| **Keyset Pagination** | `WHERE (created_at, id) < ($1, $2) LIMIT 20` | $O(\log N)$ seeks; avoids high-offset sequential scan penalties |

---

## Interview Questions

### 1. In PostgreSQL, what is the fundamental difference between an `Index Scan` and an `Index Only Scan`, and what role does the Visibility Map play?

> **Index Only Scan**: A physical scan where all requested columns reside in the index itself, avoiding table heap tuple lookups using the Visibility Map.

In a standard **Index Scan**, the query engine traverses the B-Tree index to locate the Tuple Identifiers (TIDs) of matching index entries. Each TID consists of a physical page block number and a tuple offset on that page. PostgreSQL must then visit the actual table heap page on disk or in the shared buffer pool to retrieve the remaining column values requested in the `SELECT` clause and to verify whether the tuple is visible to the active transaction under MVCC rules.

In an **Index Only Scan**, all columns required by both the `WHERE` filter and the `SELECT` projection are already present within the index itself (either as indexed keys or via the `INCLUDE` clause). Crucially, PostgreSQL can only bypass visiting the table heap if it can confirm that the row is visible to the current transaction. PostgreSQL indexes do not contain MVCC transaction visibility metadata (`xmin` and `xmax`). Instead, PostgreSQL inspects the **Visibility Map (VM)**. The Visibility Map tracks whether all tuples on a given heap page are older than the oldest running transaction. If the VM indicates the target page is fully visible, PostgreSQL reads the data entirely from the index without reading the heap page. If the page is not marked fully visible, it must fall back to checking the heap tuple. Regular `VACUUM` runs are necessary to maintain the Visibility Map for Index Only Scans.

---

### 2. How does the Cost-Based Optimizer (CBO) decide between a `Seq Scan` and an `Index Scan`, and why might it choose a sequential scan on an indexed column?

> **Cost-Based Optimizer (CBO)**: The PostgreSQL query planner module that estimates disk I/O and CPU costs across candidate execution trees using table statistics (`pg_statistic`).

The Cost-Based Optimizer estimates the total cost of candidate execution plans in arbitrary cost units based on the cost of disk page fetches and CPU tuple processing. Key parameters include `seq_page_cost` (default 1.0) and `random_page_cost` (default 4.0, reflecting mechanical disk random access or cached SSD reads).

The CBO will choose a `Seq Scan` over an `Index Scan` under two primary circumstances:
1. **Low Table Size:** If the table has fewer than a few hundred pages, loading the sequential blocks into memory requires less overhead than traversing a B-Tree index and performing random lookups.
2. **Low Selectivity (High Hit Ratio):** If a query filter matches a significant percentage of the table (typically 10% to 20% or more), traversing the index requires numerous random page reads across the heap. Sequential scans read memory blocks sequentially in contiguous order, allowing the operating system and storage controller to perform efficient read-ahead caching. When the planner's statistical histograms in `pg_statistic` estimate that a query will match many rows, it correctly recognizes that a sequential scan is faster than thousands of random heap page lookups.

---

### 3. What is the difference between a `Nested Loop Join`, a `Hash Join`, and a `Merge Join`, and how does memory configuration (`work_mem`) affect join performance?

PostgreSQL implements three primary join algorithms:
1. **Nested Loop Join:** For each row in the outer table, PostgreSQL searches the inner table. When the outer dataset is small and the inner table has an efficient index on the join key, this is extremely fast. However, if the inner table is unindexed or the outer table is large, cost scales as $O(N \times M)$.
2. **Hash Join:** PostgreSQL scans the inner table and builds an in-memory hash table of the join keys. It then scans the outer table and probes the hash table for matches. This requires no indexes and scales as $O(N + M)$, making it ideal for medium-to-large unindexed datasets.
3. **Merge Join:** Both inputs are sorted on the join key (either by an existing index or an explicit sort step) and scanned in parallel like a zipper. It is highly efficient for large datasets when inputs are already ordered.

The `work_mem` configuration directly governs `Hash Join` and sorting performance. During a Hash Join, the hash table is built within `work_mem`. If the hash table exceeds `work_mem`, PostgreSQL must divide the join into multiple batches and spill intermediate hash buckets to temporary disk files. Disk-based hashing incurs substantial I/O latency, slowing queries significantly.

---

### 4. How does the $N+1$ query problem degrade performance in Node.js microservices, and how does database-side JSON aggregation (`json_agg`) resolve it without Cartesian row explosion?

The $N+1$ query problem forces the application to execute 1 initial query to fetch $N$ parent records, followed by $N$ individual network queries in a loop to fetch related child records. In Node.js, this causes several compounding issues:
1. **Connection Pool Starvation:** The loop holds and checks out pool connections repeatedly, queueing other concurrent web requests.
2. **Latency Amplification:** Even with a fast 1ms database roundtrip, executing 100 queries sequentially adds 100ms of pure socket network overhead.
3. **Event Loop Overhead:** Parsing and resolving 100 separate database protocol responses consumes CPU time on the single-threaded Node.js event loop.

Using a traditional SQL `LEFT JOIN` eliminates the multiple roundtrips, but introduces **Cartesian Row Explosion (Row Multiplication)**. If each parent has 20 child items, the parent's data (IDs, strings, timestamps) is repeated 20 times across 20 separate network rows. This wastes bandwidth and requires Node.js to run expensive memory grouping loops to reconstruct the nested objects.

PostgreSQL's `json_agg()` combined with `json_build_object()` solves this cleanly. The database aggregates the child records directly into a native JSON array within the database process before streaming the result:
```sql
SELECT p.id, p.name, json_agg(json_build_object('id', t.id, 'title', t.title)) AS tasks
FROM projects p LEFT JOIN tasks t ON t.project_id = p.id
GROUP BY p.id;
```
This reduces the entire operation to exactly **1 network roundtrip**, produces zero duplicated parent data across the wire, and allows `node-postgres` to deserialize the result directly into structured JavaScript objects without application-level grouping loops.

---

<nav aria-label="Lecture navigation">

[Previous: Relational Correctness for APIs](day-29-relational-correctness-for-apis.md) | [Roadmap](../node-roadmap.md) | [Next: PostgreSQL Transactions, MVCC, and Locks](day-31-postgresql-transactions-mvcc-and-locks.md)

</nav>