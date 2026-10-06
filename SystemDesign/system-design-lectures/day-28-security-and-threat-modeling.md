# Day 28: Security and Abuse Resistance

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> | Previous: <a href="day-27-observability-and-diagnosis.md">Day 27</a> | Next: <a href="day-29-monoliths-and-service-boundaries.md">Day 29</a></nav>

## What You Will Learn Today

- Identify assets, actors, trust boundaries, and abuse cases before choosing controls.
- Separate authentication, authorization, and service-to-service identity.
- Apply least privilege, input/resource limits, and rate limiting across distributed instances.
- Include secrets, encryption, auditability, and incident response in the design.

## Prerequisites

- [Day 03: Functional Requirements, Quality Attributes, and Constraints](day-03-requirements-and-quality-attributes.md)
- [Day 06: Networking and Request Lifecycle](day-06-networking-and-request-lifecycle.md)
- [Day 08: API and Interface Design](day-08-api-and-interface-design.md)
- [Day 12: Load Balancing and Stateless Services](day-12-load-balancing-and-stateless-services.md)

## Quick Vocabulary Card

- **Threat modeling:** A structured way to identify assets, trust boundaries, threats, and mitigations.
- **Authentication:** Establishing which user or service is making a request.
- **Authorization:** Deciding whether that identity may perform a particular action on a resource.
- **Least privilege:** Giving an identity only the permissions and duration it needs.
- **Rate limit:** A policy that bounds request volume or cost for a defined identity and time scope.
- **Trust boundary:** A point where identity, control, or data-handling assumptions change.

## Core Concepts

Security belongs in architecture because boundaries determine who can issue actions, reach data, and consume resources. Begin with assets and flows: what must be protected, who uses it, which components handle it, and where trust changes. The roadmap’s [Day 28 entry](../system-design-roadmap.md#day-28-security-and-abuse-resistance) links the [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) and [OWASP API Security Project](https://owasp.org/www-project-api-security/); use their guidance with the application's threat model and applicable standards.

### Threat-model the flow

For file sharing, assets include file bytes, sharing links, user identities, metadata, and audit records. Actors include owners, invited recipients, anonymous visitors, administrators, service identities, and attackers. Trust boundaries include browser-to-edge, edge-to-API, API-to-database/object storage, and service-to-service calls. Ask how each asset could be read, changed, deleted, or used to consume disproportionate resources. Consider threats such as broken object-level authorization, credential theft, malicious uploads, public-link guessing or leakage, replay, denial of service, and privileged operator misuse.

For each high-risk path, pair a control with the threat it addresses and how it is verified. Authentication proves identity but does not establish ownership of every file. Authorization should check the requested action against the specific resource and policy, ideally at a trusted boundary close to the data operation. Avoid trusting client-supplied owner IDs without binding them to authenticated identity.

### Identity, least privilege, and secrets

Use separate identities for users, services, operators, and automation. Give each service only required database tables, object prefixes, actions, and environment access. Limit credential lifetime where the platform supports it, rotate secrets, and avoid embedding credentials in source code, container images, logs, URLs, or build output. Store and deliver secrets through an approved secret-management mechanism; exact mechanisms and rotation guarantees vary by environment.

Encrypt traffic across network boundaries with appropriately validated TLS, and protect stored data according to sensitivity and key-management policy. Encryption at rest does not prevent an overprivileged service from reading data. Audit sensitive actions such as permission changes, file sharing, and administrative access, with tamper-resistant retention appropriate to policy. Avoid collecting more sensitive data than the feature needs.

### Abuse controls and distributed rate limits

Set limits on request body size, file size, page size, execution time, concurrency, and expensive query shape. Rate limits can apply by account, API key, IP, tenant, endpoint, or a combination. IP-only limits are vulnerable to shared NAT and distributed clients; account-only limits can be bypassed with account creation. Use layered controls and a clear policy for trusted customers, anonymous flows, and abuse response.

With multiple API instances, an in-memory counter enforces only a local limit. If each of five instances permits 100 requests per minute, a caller distributed across all five may reach roughly 500, depending on routing and algorithm. A shared limiter can centralize state but adds latency and a dependency; local token buckets can offer a bounded approximation or protect each instance. Decide whether to fail open or closed when the limiter store is unavailable based on endpoint risk, and protect the limiter itself from hot keys and attacker-controlled cardinality. Document window/burst semantics; exact enforcement depends on algorithm and consistency.

### Safe uploads and operational response

Treat uploaded content and metadata as untrusted. Validate size and allowed formats, inspect actual content rather than trusting a filename or declared type, quarantine before publication when scanning is required, and isolate parsers or transformations appropriately. Restrict signed access to one object and action; assume URLs may leak and set expiration and cache policy accordingly. Apply authorization again when creating shares and revoking access.

Security controls need observability that does not leak secrets. Log decisions and stable identifiers, not bearer tokens or private file URLs. Alert on abuse patterns and privilege changes; define how credentials are revoked, affected sessions invalidated, and impacted users or data investigated. A threat model should evolve after incidents, architecture changes, and new abuse patterns.

## Common Mistakes and Interview Traps

- Equating authentication with authorization or checking only that a user is logged in.
- Trusting a client-supplied resource owner or object key as proof of access.
- Granting broad service roles because fine-grained permissions are inconvenient.
- Relying on one IP limit or per-process counters across a distributed fleet.
- Treating encryption at rest as protection from compromised application credentials.
- Publishing uploads before validation/scanning or trusting file extensions alone.
- Putting bearer tokens and signed URLs in logs or analytics.
- Failing open or closed for every endpoint without assessing business/security impact.

## Tricky Points

Distributed rate limits trade consistency and availability against latency and cost. A shared store can fail or become a bottleneck; local enforcement may allow aggregate overshoot. State the enforcement scope and acceptable burst/error. Also, authorization caches and signed links introduce revocation delay: define the maximum window and a control for high-risk revocation. Least privilege should cover operators and telemetry systems as well as runtime services.

## Practical Exercise

**Goal:** Threat-model a file-sharing API and select controls for its highest-risk paths.

**Inputs/context:** Users upload private files, create share links, revoke access, and download through a CDN. Administrators can respond to reports; multiple API instances handle traffic.

**Constraints:** Identify assets and trust boundaries; define user and service authorization; set resource limits and layered rate limiting; address secret handling, audit, signed-link revocation, and limiter failure mode.

**Edge cases:** Cross-user object ID guessing; shared URL leaks; malicious oversized upload; CDN serves revoked file; shared limiter outage; high-cardinality attacker keys; compromised worker role.

**Acceptance criterion:** Provide a threat/mitigation table for at least five risks, state rate-limit key and failure policy by endpoint class, define least-privilege roles, and name audit/alert signals without logging secrets. Do not implement authentication code.

## Summary

Threat modeling starts with assets, actors, trust boundaries, and realistic abuse. Authentication identifies a caller; authorization checks the action on the specific resource. Least privilege, input/resource limits, layered rate limiting, secure secret handling, safe upload states, and auditable operations belong in the design. Distributed controls have explicit failure and revocation windows that should be stated and tested.

## Cheat Sheet

- Map asset, actor, data flow, trust boundary, threat, control, and verification.
- Authenticate identity; authorize every resource/action; bind ownership server-side.
- Apply least privilege to services, operators, storage, databases, and telemetry.
- Layer rate limits; per-instance counters do not enforce one global quota.
- Bound payloads, work, concurrency, and query cost; quarantine untrusted uploads.
### Common Pitfalls

- Authn/authz confusion; IP-only limits; broad roles; secrets in telemetry; unstated revocation delay.

## Interview Questions

1. **[Hard]** Threat-model a private file download. **Expected answer shape:** Assets, actors, trust boundary, authentication, resource authorization, signed access, CDN/cache risks, and audit. **Follow-up:** How quickly must revocation take effect?
2. **[Hard]** Why is authentication insufficient to protect `GET /files/{id}`? **Expected answer shape:** Object-level authorization, ownership policy, identifier guessing, server-side binding, and non-disclosure choice. **Follow-up:** What should the API return for an unauthorized identifier?
3. **[Hard]** Design rate limiting across five API instances. **Expected answer shape:** Key dimensions, algorithm/burst, shared versus local enforcement, failure policy, and attacker-controlled cardinality. **Follow-up:** How would you protect shared-NAT users while limiting account abuse?
4. **[Very Hard]** A worker needs read access to uploaded files for scanning and can also delete them. Redesign its privileges and the upload lifecycle. **Expected answer shape:** Least privilege, quarantine scope, separate publishing/deletion authority, audit, credential handling, failure containment, and verification. **Follow-up:** How would you investigate a compromised worker without exposing private content in logs?