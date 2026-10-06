# Day 08: API and Interface Design

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> | Previous: <a href="day-07-diagrams-and-architecture-communication.md">Day 07</a> | Next: <a href="day-09-data-modeling-and-storage-choices.md">Day 09</a></nav>

## What You Will Learn Today

- Turn user actions into stable resource-oriented HTTP contracts.
- Define validation, pagination, and errors so callers can act predictably.
- Distinguish HTTP method semantics from an application-level idempotency guarantee.
- Evolve an API without silently changing behavior for existing clients.

## Prerequisites

- [Day 06: Networking and Request Lifecycle](day-06-networking-and-request-lifecycle.md)

## Quick Vocabulary Card

- **Resource:** A named domain object exposed through an API, such as a short link.
- **Contract:** The documented request, response, error, and compatibility behavior clients can rely on.
- **Idempotent method:** An HTTP method whose intended effect is the same after one or repeated identical requests; this does not promise identical response bytes.
- **Cursor pagination:** Returning a bounded page plus a continuation position, rather than skipping an ever-growing number of rows.
- **Compatibility:** Whether a client using an older contract continues to work after a server change.

## Core Concepts

An API is a boundary between independently changing callers and services. Design it around product actions and resource state, not around internal database tables. HTTP supplies useful method and status semantics, but the application still has to define validation, authorization, error details, limits, and what a retry means. The roadmap’s [Day 08 entry](../system-design-roadmap.md#day-08-api-and-interface-design) links the governing [HTTP Semantics specification, RFC 9110](https://www.rfc-editor.org/rfc/rfc9110).

### Make the contract explicit

For a short-link service, a small contract might be:

```text
POST   /v1/links          create a link
GET    /v1/links/{id}     read owned link metadata
DELETE /v1/links/{id}     revoke a link
GET    /v1/{code}         redirect a visitor
```

The create request can accept a destination and optional expiry; the response can return a stable identifier, code, and canonical URL. Validate syntax and policy at the boundary: maximum length, allowed schemes, expiry range, and caller authorization. Return a documented client error for invalid input, not a generic server failure. Do not echo secrets or sensitive input in error bodies. A useful error object has a stable machine-readable code and a human-readable message; clients should branch on the code or status, not parse prose.

Status codes are part of the contract. A successful creation may return `201 Created` and a `Location` header. A missing resource can return `404`; an authenticated caller without permission may receive `403`, though some products deliberately use `404` to avoid disclosing existence. State the choice. A request that cannot be processed due to a temporary service failure differs from one rejected by validation. Include request identifiers for support, but do not make them a substitute for observability.

### Pagination is a consistency decision

An unbounded list endpoint can exhaust memory, database capacity, or response limits. Put a maximum on page size and define a stable ordering. Offset pagination is easy to understand and can work for small, stable result sets, but deep offsets may require scanning skipped rows and concurrent inserts can shift page boundaries. Cursor pagination uses a continuation token derived from an ordered key, often a timestamp plus unique identifier. The token should be opaque to clients; validate it and bind it to the filter and sort context so callers cannot accidentally resume a different query. Cursor pagination reduces shifting for keyset-style traversal but does not by itself provide a snapshot across pages.

### Idempotency is a contract, not a magic header

RFC method semantics distinguish safe and idempotent methods, but a `POST` that creates a new resource is not automatically safe to replay. If a client times out after submitting a create, the server may have committed even though the client never received the response. An application can accept an idempotency key for such operations. Scope the key to the authenticated principal and operation, store a request fingerprint and the outcome, and define a retention period. Reuse with a different payload should be rejected rather than treated as the original request. Concurrent requests with the same key must converge on one operation, usually through a unique constraint or equivalent atomic claim. A client-provided key is not authorization.

For example, two identical create requests with the same key should produce one short-link record and a replayable result. Two requests with different keys may create two links, even if their bodies match. The result is only as durable as the deduplication record and its scope: after expiry, a retry may be a new operation. For naturally idempotent revocation, repeating `DELETE` should leave the resource revoked; decide whether the second response is `204`, `404`, or a stable success and document that behavior.

### Evolve without surprising callers

Prefer additive optional response fields and new optional request capabilities when old clients can ignore them. Changing a field’s meaning, making an optional field required, changing units, or tightening validation can break clients even if the JSON shape still parses. Use explicit versioning when a breaking contract is unavoidable. A URI version such as `/v2` is visible and straightforward; media-type or header versioning can be appropriate where the ecosystem already supports it. Versioning creates migration and support costs, so it is not a substitute for compatible change practices. Define deprecation communication and a removal window, and observe actual client use before removing a version.

## Common Mistakes and Interview Traps

- Exposing database table names and internal fields as if they were stable product concepts.
- Treating every `POST` as retry-safe or assuming a timeout means the operation did not happen.
- Adding an idempotency key without defining principal scope, payload mismatch, concurrency, or retention.
- Returning unbounded collections or allowing clients to choose unlimited page sizes.
- Claiming cursor pagination creates a consistent snapshot without a snapshot mechanism.
- Calling additive changes universally safe when strict clients reject unknown fields or generated schemas change.
- Choosing `403` versus `404` without considering resource-existence disclosure and product semantics.

## Tricky Points

Idempotency refers to the intended effect, not necessarily byte-for-byte identical responses. A repeated `PUT` can leave state unchanged while returning a different representation if other fields have since changed. Likewise, the HTTP method’s defined semantics do not guarantee that an implementation is correct, durable, or safe under concurrent application behavior. State the actual application contract and the persistence mechanism that enforces it.

## Practical Exercise

**Goal:** Define a contract for creating, reading, listing, and revoking short links.

**Inputs/context:** Owners create links; visitors follow them; owners can list their own links. A create request may be retried after a client timeout.

**Constraints:** Set a maximum list page size, specify a stable sort, choose one versioning policy, and define idempotency-key scope and retention. No vendor-specific assumptions.

**Edge cases:** Invalid destination scheme, expired link, unknown identifier, unauthorized owner, reused key with changed payload, concurrent duplicate requests, and a retry after the key expires.

**Acceptance criterion:** Write method/path, request and response fields, success and error status behavior, pagination token semantics, compatibility policy, and a test matrix for the edge cases. Do not implement the API or provide a full solution.

## Summary

Treat an API as a durable client-facing contract. Define resource behavior, validation, errors, bounded pagination, and compatibility rules. HTTP semantics help set expectations, but application-level idempotency needs explicit scope, payload matching, concurrency control, retention, and replay behavior. A timeout leaves the result uncertain; the contract must make safe recovery possible.

## Cheat Sheet

- Design around resources and client operations, not database tables.
- Bound page size; define sort order and continuation semantics.
- Distinguish HTTP method semantics from application-level duplicate suppression.
- Idempotency key: principal + operation + key + payload fingerprint + atomic outcome + retention.
- Prefer compatible additive changes; version intentionally when meaning or requirements break.
### Common Pitfalls

- Retrying unsafe writes blindly; changing field meaning; leaking resource existence; unbounded lists; treating cursors as snapshots.

## Interview Questions

1. **[Hard]** Define a create-link API that remains understandable under validation failures. **Expected answer shape:** Resource and method, request/response contract, status codes, stable error shape, authorization, and limits. **Follow-up:** Which errors should callers retry?
2. **[Hard]** A client times out after `POST /v1/links`. Can it safely submit the request again? **Expected answer shape:** Explain uncertain completion, method semantics, application idempotency record, key scope, payload fingerprint, and retention. **Follow-up:** What should concurrent requests with one key do?
3. **[Hard]** Compare offset and cursor pagination for an owner's growing link list. **Expected answer shape:** Query cost, stable ordering, inserts between pages, token binding, and snapshot limitations. **Follow-up:** How would you support changing sort order?
4. **[Very Hard]** A server must replace a response field and tighten validation while older mobile clients may remain installed for months. Defend an evolution plan. **Expected answer shape:** Compatibility inventory, additive transition or explicit version, telemetry, deprecation window, error behavior, and rollback. **Follow-up:** What evidence is enough to retire the old contract?