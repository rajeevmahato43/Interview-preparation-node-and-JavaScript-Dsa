# Day 33: Layered Backend Architecture

<nav aria-label="Lecture navigation">

[Previous: PostgreSQL in Express](day-32-postgresql-in-express.md) | [Roadmap](../node-roadmap.md) | [Next: Deadlines, Retries, and Idempotency](day-34-deadlines-retries-and-idempotency.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Architect maintainable, modular Node.js backends adhering to Clean / Hexagonal Layered Architecture principles.
- Decouple transport mechanisms (HTTP/Express/gRPC) from business domains and persistence technologies (PostgreSQL/MongoDB).
- Implement the Dependency Inversion Principle (DIP) using functional Dependency Injection (Factory Functions) without heavy reflection frameworks.
- Assemble application lifecycles cleanly using a dedicated **Composition Root** to eliminate global singletons and circular imports.
- Enforce strict Data Transfer Object (DTO) projection boundaries between API payloads, domain models, and database rows.
- Design targeted testing suites across layers, isolating business unit tests from database integration tests.

---

## Prerequisites

- [Day 13: Express Application Structure](day-13-express-application-structure.md) — Application factories, routers, and module cohesion.
- [Day 26: MongoDB in Express](day-26-mongodb-in-express.md) — Document repository layering.
- [Day 32: PostgreSQL in Express](day-32-postgresql-in-express.md) — Relational repository layering and the Executor pattern.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Production Impact |
|---|---|---|
| **Fat Controller** | An anti-pattern where HTTP route handlers execute input validation, database queries, business policy checks, and response formatting in a single function. | Makes code virtually impossible to unit test, couples business logic to Express, and leads to massive code duplication. |
| **Dependency Inversion (DIP)** | An architectural principle stating that high-level modules (business rules) must not depend on low-level modules (SQL drivers); both depend on abstractions. | Allows swapping persistence engines (e.g., PostgreSQL for an in-memory mock) without modifying a single line of business code. |
| **Composition Root** | A single centralized location at application startup where all concrete infrastructure instances are wired into domain services. | Eliminates hidden global singletons, resolves circular dependencies, and ensures deterministic startup ordering. |
| **Domain Entity** | A core business object encapsulating enterprise invariants and state manipulation methods, completely independent of databases or HTTP frameworks. | Protects business rules from external technology churn and framework migrations. |
| **DTO (Data Transfer Object)** | A plain serializable object that carries data between processes or layers without containing business logic. | Prevents sensitive persistence data (`password_hash`, internal flags) from leaking across the API transport perimeter. |

---

## Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          CLEAN LAYERED ARCHITECTURE BOUNDARIES                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Incoming Request (HTTP / REST / gRPC / CLI / SQS)
                 │
                 ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │ 1. PRESENTATION / TRANSPORT LAYER (Controllers, Middleware, Routers)                    │
  │    • Validates HTTP syntax, headers, query params via Zod.                              │
  │    • Translates HTTP requests to pure Input DTOs.                                       │
  │    • Calls Application Services.                                                        │
  │    • Maps domain results to HTTP Status Codes & RFC 7807 JSON envelopes.               │
  │    • DEPENDS ON: Application Layer. NEVER imports Database Drivers.                     │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
                 │ Passes Input DTO
                 ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │ 2. APPLICATION / SERVICE LAYER (Use Cases & Orchestration)                              │
  │    • Coordinates application workflows (e.g., "RegisterUser", "PlaceOrder").            │
  │    • Enforces transaction boundaries and cross-entity workflows.                         │
  │    • Triggers domain events and background notifications.                               │
  │    • DEPENDS ON: Domain Layer & Repository Abstractions. ZERO HTTP coupling.            │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
                 │ Evaluates Invariants / Enforces Policies
                 ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │ 3. DOMAIN LAYER (Entities, Value Objects, Domain Policies)                              │
  │    • Encapsulates core business rules (e.g., "Discount cannot exceed 50%").             │
  │    • Pure JavaScript: NO dependencies on Express, PostgreSQL, AWS, or npm packages.    │
  │    • 100% Unit testable in milliseconds.                                                │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
                 │ Persists Data / Dispatches Events
                 ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │ 4. INFRASTRUCTURE / PERSISTENCE LAYER (Repositories, DB Drivers, External SDKs)         │
  │    • Implements repository interfaces defined by domain/service layers.                 │
  │    • Executes SQL queries ($1, $2) via pg.Pool or MongoDB driver calls.                 │
  │    • Manages Redis caching, Stripe SDKs, and Kafka/RabbitMQ publishers.                 │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. The Anatomy of a Layered Backend

A layered backend partitions responsibilities into horizontal strata with a unidirectional dependency flow:

1. **Presentation / Transport Layer:**
   - **Responsibility:** Adapting network protocols to the application domain.
   - **Artifacts:** Express routers, controller functions, validation middleware (`zod`), authentication guards.
   - **Rule:** Never leak `req` or `res` objects into the service layer. Passing `req` into a service binds that business function forever to Express, preventing reuse in background workers, queue consumers, or CLI scripts.

2. **Application / Service Layer:**
   - **Responsibility:** Orchestrating use-cases and coordinating domain entities with infrastructure services.
   - **Artifacts:** Service classes or factory closures (`UserService`, `OrderProcessingService`).
   - **Rule:** Services take plain JavaScript primitives/DTOs and return plain JavaScript domain entities or DTOs.

3. **Domain Layer:**
   - **Responsibility:** Pure business invariants and enterprise logic.
   - **Artifacts:** Entity models, value objects (e.g., `Money`, `EmailAddress`), domain calculation functions.
   - **Rule:** Zero external dependencies. The domain layer must not import `express`, `pg`, `mongodb`, or network libraries.

4. **Infrastructure Layer:**
   - **Responsibility:** Concrete technical implementations of I/O, storage, and external communication.
   - **Artifacts:** `PostgresUserRepository`, `RedisCacheAdapter`, `StripePaymentGateway`.

---

### 2. Dependency Inversion and Functional Dependency Injection

The **Dependency Inversion Principle (DIP)** states:
> 1. High-level modules should not depend on low-level modules. Both should depend on abstractions.
> 2. Abstractions should not depend on details. Details should depend on abstractions.

In traditional, tightly coupled Node.js code, services directly import database clients or concrete repository files:

```javascript
// Node.js code
// anti-pattern: High-level service directly coupled to low-level PostgreSQL pool
import { dbPool } from '../config/database.js'; // ❌ Concrete database singleton imported!
import { sendEmail } from '../utils/mailer.js';   // ❌ Hardcoded external side-effect!

export async function registerUser(email, password) {
  // Impossible to test without spinning up live Postgres and SMTP servers!
  const user = await dbPool.query('INSERT INTO users ...');
  await sendEmail(email, 'Welcome!');
  return user;
}
```

In Clean Architecture, dependencies are injected into the service at creation time. In modern Node.js, **Functional Dependency Injection via Factory Functions** provides complete testability and decoupling without requiring complex TypeScript reflection decorators or bulky DI container frameworks:

```javascript
// Node.js code
// pattern: Functional Dependency Injection via Factory Function
export function createUserService({ userRepository, emailGateway, logger }) {
  // High-level service depends only on abstract interfaces provided in arguments
  return {
    async registerUser({ email, role }) {
      logger.info('Registering new user', { email });

      const existing = await userRepository.findByEmail(email);
      if (existing) {
        const error = new Error('Email is already registered');
        error.status = 409;
        throw error;
      }

      const user = await userRepository.create({ email, role });
      await emailGateway.sendWelcomeEmail(user.email);

      return user;
    }
  };
}
```

---

### 3. The Composition Root

The **Composition Root** is the unique location in an application where the dependency graph is composed at process startup. In an Express application, this is typically `app.js` or `container.js`.

By instantiating all singletons (database connection pools, Redis clients, external API clients), injecting them into repositories, injecting repositories into services, and injecting services into controllers, the entire application becomes deterministic and free of hidden global state:

```javascript
// Node.js code
// pattern: Composition Root (container.js)
import pg from 'pg';
import { createLogger } from './infrastructure/logger.js';
import { PostgresUserRepository } from './infrastructure/repositories/PostgresUserRepository.js';
import { SendgridEmailGateway } from './infrastructure/gateways/SendgridEmailGateway.js';
import { createUserService } from './services/userService.js';
import { createUserController } from './controllers/userController.js';
import { createUserRouter } from './routes/userRoutes.js';

export function buildContainer(config) {
  // 1. Initialize Infrastructure
  const logger = createLogger(config.logLevel);
  const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    max: config.dbPoolMax
  });

  // 2. Initialize Repositories and Gateways
  const userRepository = new PostgresUserRepository(pool);
  const emailGateway = new SendgridEmailGateway(config.sendgridApiKey);

  // 3. Initialize Services with Injected Dependencies
  const userService = createUserService({
    userRepository,
    emailGateway,
    logger
  });

  // 4. Initialize Controllers
  const userController = createUserController({ userService, logger });

  // 5. Initialize Routes
  const userRouter = createUserRouter({ userController });

  return {
    pool,
    userRouter,
    userService
  };
}
```

---

### 4. Data Transfer Objects (DTOs) vs Domain Entities vs Persistence Entities

A common defect in Express backends is passing database row objects directly out of route handlers as API JSON responses:

```javascript
// Node.js code
// anti-pattern: Leaking persistence entities to API clients
app.get('/users/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  // ❌ DISASTER: Leaks password_hash, internal_version, deleted_at, and billing_ssn!
  res.json(result.rows[0]);
});
```

To protect security and maintain independent contracts, maintain three distinct data models:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             DATA BOUNDARY TRANSFORMATIONS                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  1. Request Body (JSON)
          │
          ▼  Zod Validation
  2. Input DTO: { email: string, role: string }
          │
          ▼  Service / Domain Instantiation
  3. Domain Entity: User(id, email, role, status) [Enforces invariants]
          │
          ▼  Repository Persistence Mapping
  4. Database Tuple (SQL): INSERT INTO users (id, email, role, hashed_password, created_at)
          │
          ▼  Response Projection
  5. Output DTO: { id: string, email: string, role: string, createdAt: string }
```

```javascript
// Node.js code
// pattern: Output DTO projection boundary
export function toUserResponseDTO(userEntity) {
  return {
    id: userEntity.id,
    email: userEntity.email,
    role: userEntity.role,
    createdAt: userEntity.createdAt.toISOString()
    // Explicitly excludes: passwordHash, internalFlags, tenantMetadata
  };
}
```

---

## Detailed Explanations and Traces

### Execution Trace: Handling an HTTP Request Through the Layers

Let us trace the flow of a `POST /api/v1/users` request across all four architectural layers:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            LAYERED REQUEST EXECUTION TRACE                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

 1. HTTP Network Socket:
    - Express parses JSON body into req.body.
 
 2. Presentation Layer (UserController):
    - Validates schema: CreateUserSchema.parse(req.body).
    - Unpacks primitive DTO: { email: "user@corp.com", role: "ADMIN" }.
    - Invokes Service: await userService.registerUser(dto).
 
 3. Application Service Layer (UserService):
    - Evaluates business rule: checks if domain allows new admins.
    - Queries repository: await userRepository.findByEmail(dto.email).
    - If user exists, throws DomainConflictError("Email already registered").
    - Hashes password using bcrypt.
    - Persists user: await userRepository.create({ ... }).
 
 4. Persistence Layer (PostgresUserRepository):
    - Formulates SQL statement with parameterized placeholders ($1, $2).
    - Executes query on pg.Pool socket.
    - Maps database row to Domain Entity.
    - Returns Entity back to Service.
 
 5. Application Service Layer:
    - Dispatches async welcome email via emailGateway (without blocking DB).
    - Returns Domain Entity back to Controller.
 
 6. Presentation Layer:
    - Projects Domain Entity into Output DTO (stripping sensitive hashes).
    - Sends HTTP 201 Created with JSON envelope.
```

---

## Common Mistakes and Interview Traps

### 1. The Pass-Through Service Anti-Pattern

Developers often create services that do nothing more than mechanically forward arguments to repositories:

```javascript
// Node.js code
// anti-pattern: Pure pass-through ceremony layer
export class UserService {
  constructor(userRepo) { this.userRepo = userRepo; }
  async getUserById(id) {
    return await this.userRepo.findById(id); // Zero business value!
  }
}
```
If a read operation involves no business invariants, authorizations, or domain transformations, introducing a 5-line pass-through method adds needless ceremony. However, for write operations, workflows, and business policies, services are mandatory.

### 2. Passing `req` and `res` Into Services

Passing `req` into a service method (`userService.updateProfile(req)`) introduces tight coupling to the Express framework. The service can no longer be invoked from a scheduled cron job, a WebSocket handler, or a background worker. Always extract parameters in the controller and pass explicit primitives or DTO objects.

---

## Tricky Points and Edge Cases

### 1. Handling Cross-Repository Transactions in the Service Layer

When a business use case requires mutations across multiple repositories within a single database transaction, the service layer must coordinate the transaction without directly coupling to driver-specific SQL grammar:
- **Solution:** Use the **Executor pattern** (covered in Day 32) or a **Unit of Work** manager. The service manages `beginTransaction()` / `commit()`, and passes the transaction context into repository methods.

---

## Hands-On Exercise: Refactoring a Sprawling Monolithic Controller

### Scenario

You have inherited a monolithic Express route handler for organization member onboarding. The handler contains 120 lines mixing Zod validation, raw SQL queries on a global pool, bcrypt hashing, domain role permission checks, Stripe billing API calls, and HTTP responses.

### Buggy Monolithic Route

```javascript
// Node.js code
// anti-pattern: Monolithic Fat Controller
import express from 'express';
import bcrypt from 'bcrypt';
import { dbPool } from './globalDb.js'; // ❌ Global singleton
import Stripe from 'stripe';           // ❌ Hardcoded external dependency

const stripe = new Stripe(process.env.STRIPE_KEY);
export const router = express.Router();

router.post('/organizations/:orgId/members', async (req, res) => {
  try {
    const { orgId } = req.params;
    const { email, password, role } = req.body;

    // 1. Validation mixed with HTTP
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    // 2. Raw SQL queries directly in route
    const orgCheck = await dbPool.query('SELECT * FROM organizations WHERE id = $1', [orgId]);
    if (orgCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // 3. Business rule hardcoded in controller
    if (role === 'OWNER' && orgCheck.rows[0].tier !== 'ENTERPRISE') {
      return res.status(403).json({ error: 'Only enterprise orgs can have multiple owners' });
    }

    // 4. Cryptographic hashing in controller
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Database writes directly in controller
    const userRes = await dbPool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
      [email, hashedPassword]
    );

    await dbPool.query(
      'INSERT INTO memberships (org_id, user_id, role) VALUES ($1, $2, $3)',
      [orgId, userRes.rows[0].id, role]
    );

    // 6. External network side-effect inside route
    await stripe.customers.create({ email, metadata: { orgId } });

    // 7. Leaking database columns (password_hash) in response!
    res.status(201).json(userRes.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### Acceptance Criteria

1. Decompose the monolith into 4 distinct layers: Controller, Service, Repository, and Infrastructure.
2. Implement functional Dependency Injection with a Composition Root.
3. Move business invariant checks (`role === 'OWNER'` check) and password hashing into the domain/service layer.
4. Protect API response data by projecting an Output DTO that strips `password_hash`.
5. Make the Service layer 100% unit-testable using mock repositories without spinning up PostgreSQL or Stripe.

### Solution Code

```javascript
// Node.js code
import { z } from 'zod';
import bcrypt from 'bcrypt';

// ==========================================
// 1. REPOSITORIES (Persistence Layer)
// ==========================================

export class MemberRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findOrgById(orgId) {
    const { rows } = await this.pool.query(
      'SELECT id, name, tier FROM organizations WHERE id = $1',
      [orgId]
    );
    return rows[0] ?? null;
  }

  async createUserWithMembership({ orgId, email, passwordHash, role }) {
    // Transactional creation
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const userRes = await client.query(
        `INSERT INTO users (email, password_hash, created_at)
         VALUES ($1, $2, NOW())
         RETURNING id, email, created_at`,
        [email, passwordHash]
      );
      const user = userRes.rows[0];

      await client.query(
        `INSERT INTO memberships (org_id, user_id, role, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [orgId, user.id, role]
      );

      await client.query('COMMIT');
      return user;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

// ==========================================
// 2. DOMAIN ERRORS & SERVICE (Application Layer)
// ==========================================

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

export class PolicyViolationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PolicyViolationError';
    this.status = 403;
  }
}

export function createMemberService({ memberRepo, paymentGateway, logger }) {
  return {
    async onboardMember({ orgId, email, password, role }) {
      logger.info('Onboarding new organization member', { orgId, email, role });

      // Invariant 1: Organization existence check
      const org = await memberRepo.findOrgById(orgId);
      if (!org) {
        throw new NotFoundError(`Organization with ID '${orgId}' not found`);
      }

      // Invariant 2: Business policy evaluation
      if (role === 'OWNER' && org.tier !== 'ENTERPRISE') {
        throw new PolicyViolationError('Only enterprise organizations can have multiple owners');
      }

      // Secure password hashing
      const passwordHash = await bcrypt.hash(password, 10);

      // Atomic persistence
      const user = await memberRepo.createUserWithMembership({
        orgId,
        email,
        passwordHash,
        role
      });

      // External integration via injected gateway (Non-blocking failure safety)
      try {
        await paymentGateway.createCustomer({ email, orgId });
      } catch (gatewayErr) {
        logger.error('Failed to register customer in billing gateway', { error: gatewayErr.message });
      }

      return user;
    }
  };
}

// ==========================================
// 3. CONTROLLER & DTO MAPPER (Presentation Layer)
// ==========================================

const OnboardMemberSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['MEMBER', 'ADMIN', 'OWNER'])
});

export function createMemberController({ memberService }) {
  return {
    async handleOnboard(req, res, next) {
      try {
        const { orgId } = req.params;
        const validatedBody = OnboardMemberSchema.parse(req.body);

        const createdUser = await memberService.onboardMember({
          orgId,
          ...validatedBody
        });

        // Project Output DTO: Strictly strips password_hash and internal fields
        const outputDTO = {
          id: createdUser.id,
          email: createdUser.email,
          createdAt: createdUser.created_at
        };

        res.status(201).json({ data: outputDTO });
      } catch (err) {
        next(err);
      }
    }
  };
}

// ==========================================
// 4. COMPOSITION ROOT (Assembly)
// ==========================================

export function assembleMemberModule(pool, paymentGateway, logger) {
  const memberRepo = new MemberRepository(pool);
  const memberService = createMemberService({ memberRepo, paymentGateway, logger });
  const memberController = createMemberController({ memberService });

  return {
    memberRepo,
    memberService,
    memberController
  };
}
```

### Solution Explanation

1. **Decoupled Business Logic:** All business policies (checking enterprise tier for `OWNER` role, verifying organization existence) now reside inside `MemberService`. The controller has zero awareness of database schemas or business rules.
2. **Elimination of Global State:** `dbPool` and the Stripe SDK are injected via the Composition Root.
3. **Unit Testability:** To unit-test `MemberService`, engineers can pass a mock `memberRepo` (an in-memory JavaScript object) and mock `paymentGateway`, executing tests in 2 milliseconds without database setup.
4. **Data Security & DTO Projection:** The controller projects an explicit Output DTO, guaranteeing that sensitive fields (`passwordHash`) are never leaked to API consumers.

---

## Summary

- Layered architecture organizes applications into Presentation (HTTP), Application (Use Cases), Domain (Business Invariants), and Infrastructure (Database/External APIs).
- The **Dependency Inversion Principle (DIP)** ensures high-level business logic does not depend on low-level database drivers; both depend on abstractions.
- Use **Functional Dependency Injection** via factory closures to pass repositories and gateways into services without heavy frameworks.
- The **Composition Root** is the single entry point at startup that wires the entire dependency graph, eliminating global singletons and circular imports.
- Maintain strict **DTO Boundaries**: Input DTOs validate incoming requests, Domain Entities enforce business invariants, and Output DTOs project sanitized responses.

---

## Cheat Sheet

| Architecture Seam | Pattern / Technique | Key Benefit |
|---|---|---|
| **Controller** | Zod parse $\to$ Service call $\to$ Output DTO projection | Protects API from HTTP changes; zero SQL knowledge |
| **Service Factory** | `function createService({ repo, gateway })` | High testability; no framework lock-in |
| **Composition Root** | Instantiate all singletons in `app.js` | Predictable startup; zero circular imports |
| **Domain Entity** | Plain JS object/class enforcing invariants | Pure, technology-agnostic business logic |
| **Output DTO** | `{ id: user.id, email: user.email }` | Prevents sensitive persistence fields from leaking |
| **Unit Testing** | Pass mock object literals into service factory | Millisecond test execution without live databases |

---

## Interview Questions

### 1. What is the "Fat Controller" anti-pattern in Node.js, and what specific architectural vulnerabilities does it introduce into a production system?

The "Fat Controller" anti-pattern occurs when an HTTP route handler assumes multiple responsibilities: parsing request payloads, executing business logic and policy checks, querying database connections directly, orchestrating external network calls, and constructing responses.

This pattern introduces several severe architectural vulnerabilities:
1. **Zero Reusability:** Business logic embedded inside an Express route handler (`(req, res) => { ... }`) cannot be invoked by background workers, cron jobs, WebSocket connections, or CLI scripts without simulating fake HTTP request objects.
2. **Impossible Unit Testing:** Testing the business logic requires spinning up an entire Express HTTP server and a live PostgreSQL/MongoDB database, slowing down test suites and making tests brittle.
3. **Security Leaks:** Controllers querying database rows directly frequently serialize the raw database tuple directly to JSON (`res.json(rows[0])`), leaking sensitive persistence fields (`password_hash`, internal soft-delete flags, API keys) to external clients.
4. **Coupling to Transport:** If the company migrates an endpoint from REST/HTTP to gRPC or WebSockets, all business logic must be rewritten because it is inextricably bound to Express `req` and `res` objects.

---

### 2. How does the Dependency Inversion Principle (DIP) apply to a Node.js backend using Express and PostgreSQL?

The Dependency Inversion Principle states that high-level modules (business domain logic) must not depend on low-level modules (database drivers, HTTP frameworks); instead, both must depend on abstractions.

In a naive Node.js application, an `OrderService` directly imports `pg.Pool` or a concrete `PostgresOrderRepository.js`. This creates a direct dependency on PostgreSQL. If you want to run unit tests, you are forced to connect to a real PostgreSQL instance. If you want to change how orders are stored, you must modify the service.

Applying DIP in Node.js:
1. The `OrderService` defines the *shape* of the data operations it needs (e.g., `findByCustomerId(id)`, `save(order)`).
2. The service receives these dependencies through **Dependency Injection** (typically as arguments to a factory function: `createOrderService({ orderRepo })`).
3. The concrete implementation (`PostgresOrderRepository`) implements that shape and is injected into the service at application startup inside the **Composition Root**.
4. During unit tests, the service is injected with an in-memory mock repository, executing tests in memory in milliseconds without touching database drivers or network sockets.

---

### 3. What is the role of the Composition Root in a Node.js backend, and why is it superior to exporting singleton instances from modules?

The **Composition Root** is the unique, centralized location in an application where all concrete components, infrastructure drivers, repositories, services, and controllers are instantiated and wired together at process startup (typically in `app.js` or `container.js`).

Many Node.js codebases rely on module singletons:
```javascript
// database.js
export const pool = new pg.Pool(...);
// userRepo.js
import { pool } from './database.js';
export const userRepo = new UserRepo(pool);
```
Relying on module-level singletons creates serious architectural issues:
1. **Hidden Side Effects:** Importing a file triggers side-effects (opening TCP connections) before application configuration is fully parsed or validated.
2. **Circular Dependencies:** Modules importing each other's singletons create subtle runtime `undefined` evaluation bugs.
3. **Testing Nightmare:** Unit tests attempting to mock `pool` must mutate Node's module cache (`jest.mock` or dynamic proxying), leading to flaky test runs and state leakage across tests.
4. **Lifecycle Obscurity:** It is impossible to manage graceful startup or shutdown cleanly when connection pools are instantiated implicitly across arbitrary source files.

The Composition Root makes the application deterministic: configuration is loaded first, singletons are instantiated explicitly in topological order, and shutdown hooks drain resources cleanly.

---

### 4. What is the difference between an Anemic Domain Model and a Rich Domain Model in a layered backend architecture?

An **Anemic Domain Model** is an architectural pattern where domain entities are merely passive data structures (plain JavaScript objects with properties) devoid of any business logic, behavior, or invariant enforcement. In an anemic architecture, all validation, state transitions, and business calculations are implemented procedurally across disparate service classes:
```javascript
// Anemic: Entity is just a dumb data bag
const order = { id: 1, items: [], status: 'PENDING' };
// Procedural service manipulates properties directly:
order.status = 'CANCELLED';
```
The danger of an anemic model is that any service or controller can mutate the object into an illegal business state (e.g., cancelling an order that has already shipped) because the entity does not protect its own invariants.

In a **Rich Domain Model**, domain entities encapsulate both state and behavior. The entity guarantees that it can never exist in an invalid state:
```javascript
// Rich: Entity encapsulates invariants and behavior
class Order {
  #status;
  #items;
  
  cancel() {
    if (this.#status === 'SHIPPED') {
      throw new DomainError('Cannot cancel an order that has already shipped');
    }
    this.#status = 'CANCELLED';
  }
}
```
In a rich model, services act purely as orchestrators (fetching entities from repositories, invoking entity methods, and saving them back), while the entity itself enforces core business rules.

---

<nav aria-label="Lecture navigation">

[Previous: PostgreSQL Transactions, MVCC, and Locks](day-31-postgresql-transactions-mvcc-and-locks.md) | [Roadmap](../node-roadmap.md) | [Next: Deadlines, Retries, and Idempotency](day-34-deadlines-retries-and-idempotency.md)

</nav>