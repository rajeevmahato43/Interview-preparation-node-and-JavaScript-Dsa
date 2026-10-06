# Day 31: Configuration, Feature Flags, and Schema Evolution

<nav aria-label="Lecture navigation">[Roadmap](../system-design-roadmap.md) | [Previous: Day 30](day-30-service-communication-and-discovery.md) | [Next: Day 32](day-32-deployment-and-orchestration.md)</nav>

## What You Will Learn Today

- Separate deploy-time configuration, secrets, and feature behavior safely.
- Design changes for a period when old and new application versions coexist.
- Apply expand-and-contract to database and event/API evolution.
- Explain feature-flag lifecycle, rollback limits, and operational ownership.

## Prerequisites

- [Day 08: API and Interface Design](day-08-api-and-interface-design.md)
- [Day 09: Data Modeling and Storage Choices](day-09-data-modeling-and-storage-choices.md)
- [Day 29: Monoliths, Modular Monoliths, and Microservices](day-29-monoliths-and-service-boundaries.md)
- [Day 30: Service Discovery, Gateways, and Internal Communication](day-30-service-communication-and-discovery.md)

## Quick Vocabulary Card

- **Configuration:** Values that tune runtime behavior without changing the built application artifact.
- **Secret:** Sensitive configuration, such as a credential or signing key, with stricter access and rotation needs.
- **Feature flag:** A runtime decision that enables or disables a behavior for a defined audience or condition.
- **Backward-compatible change:** A change that old and new participants can tolerate during a transition.
- **Expand-and-contract:** A staged migration that first supports both old and new shapes, moves usage, then removes the obsolete shape.
- **Schema evolution:** Changing a data contract while producers, consumers, and stored records may be at different versions.

## Core Concepts

Configuration lets one application artifact behave appropriately across environments or changing conditions. Keep values typed, validate required settings at startup, and make defaults explicit; a missing database address should fail clearly rather than route somewhere unintended.

Secrets need limited access, secure delivery, auditability, and a rotation path. Do not bake them into images, source control, or logs. Rotation behavior is implementation-specific and may require clients to reconnect.

Feature flags separate deployment from exposure. A flag can support a gradual rollout, a targeted experiment, or an emergency kill switch. Each flag needs an owner, intended audience, default, evaluation behavior, and removal condition. A flag is not a substitute for authorization: a hidden feature must still enforce access rules on every relevant path. Too many long-lived flags create combinations that are hard to test and make behavior opaque. Flags that control writes need especially careful treatment because disabling the UI does not undo data already written.

Compatibility is essential because deployments are rarely instantaneous. During a rolling release, old and new application versions may serve requests together. Producers and consumers may also upgrade at different times, and queued messages can remain for hours or days. A safe change preserves the contract across this overlap window. “The new code works after the deployment finishes” is not enough if the intermediate mixed state fails.

**Worked scenario: adding a required customer region.** The current database has `customer_id` and `address`; the new application wants a non-null `region`. A dangerous single step adds a non-null column and immediately deploys code that writes it, because old instances may not supply it and existing rows have no value. Instead, expand: add the column in a way compatible with old writers, possibly nullable with a safe default strategy after checking database-specific behavior and table size. Deploy code that can read both shapes and writes the new field while tolerating absence. Backfill existing records in bounded, observable batches. Verify coverage and correctness. Then switch reads to require the field, enforce the stronger constraint when all writers comply, and finally remove compatibility code if no older reader or writer remains. Exact locking, default, and constraint costs depend on the database and version, so inspect the relevant database documentation and test against production-like data.

The same sequence applies to APIs and events. Adding an optional response field is often easier for consumers to tolerate than renaming or changing the meaning of an existing field. For events, new consumers may encounter old queued messages after deployment; they need defaults or version-aware handling. If a field must change meaning, introduce a new field or event version, dual-read or dual-write for a bounded period, measure consumer adoption, then retire the old contract. Do not infer safety only from source code: enumerate deployed consumers and replay/retention windows.

Rollback must be designed with the data transition. Application rollback is often possible while the schema remains expanded, but once new writes use a format old code cannot understand, binary rollback may be unsafe. Prefer forward-compatible schema changes and a recovery action such as disabling a feature, stopping writes, or deploying a fix-forward version. If data is transformed destructively, make backup, reconciliation, and restore costs explicit before rollout.

**Operational sequence.** State the invariant and compatibility window; inventory readers and writers; add the compatible shape; deploy tolerant code; migrate with observable progress; verify values; then switch behavior and remove old structures only after telemetry proves they are unused. Keep steps independently pausable.

## Common Mistakes and Interview Traps

- Treating environment variables as automatically safe, typed, or secret.
- Renaming a column or event field in one deployment while older versions still run.
- Enabling a flag for all users without measuring impact or retaining a kill path.
- Forgetting old queued events, third-party consumers, scheduled jobs, and rollback versions.
- Assuming “add a column” is operationally free; table size, locks, defaults, and engine version matter.

## Tricky Points

- **Backward compatible depends on direction.** A new reader may accept old records, while an old reader may reject new records. Test both producer-consumer directions during overlap.
- **Defaults can alter meaning.** A missing field is not always equivalent to `false`, zero, or an empty string.
- **Flags can be persistent architecture.** Unremoved flags multiply code paths and may become hidden dependencies.
- **Rollback after writes is not code rollback.** Stored data may have crossed a one-way compatibility boundary.

## Practical Exercise

- **Goal:** Plan a safe database migration while two application versions run concurrently.
- **Context/input:** Add a `preferred_currency` field to customer records. Old instances read and write the current schema; new instances should use the field. Existing records have no value, and a background job processes customer rows.
- **Constraints:** No maintenance window; preserve existing checkout behavior; avoid assuming a specific database's DDL guarantees. State how you will observe completion and decide when old support can be removed.
- **Edge cases:** A customer updates during backfill, a worker processes an old-format row, deployment pauses halfway, or rollback is requested after new values have been written.
- **Acceptance criterion:** Provide ordered expand/migrate/contract steps, identify compatible behavior for both app versions, define verification and pause/rollback criteria, and state what documentation must be checked for database-specific locking. Do not provide a full solution script.

## Summary

- Runtime configuration should be validated, inspectable, and separate from sensitive secrets.
- Feature flags can control exposure but need ownership, security boundaries, observability, and removal.
- Compatibility must cover mixed application versions, independent consumers, and retained messages.
- Expand-and-contract makes schema transitions staged and observable; database-specific DDL behavior needs verification.
- A rollback plan must account for data already written, not only binaries.

## Cheat Sheet

- Before change: define invariant, enumerate readers/writers, versions, and retained data.
- Expand: add a shape old code tolerates.
- Migrate: deploy tolerant code, backfill safely, measure progress and correctness.
- Contract: switch required behavior, enforce constraints, remove old paths only after adoption is proven.
- Use flags with owner, audience, default, telemetry, kill behavior, and removal date.

**Common Pitfalls**

- Big-bang rename or destructive migration.
- Secrets in artifacts or logs.
- Permanent feature flags and untested combinations.
- Declaring rollback safe without checking data compatibility.

## Interview Questions

1. **Hard:** Explain expand-and-contract and why it matters during rolling deployment. **Expected answer shape:** Describe overlapping versions and additive, migration, enforcement, and cleanup phases. **Follow-up:** Which phase is safe to pause, and what evidence permits progression?
2. **Hard:** How should a feature flag differ from authorization? **Expected answer shape:** Distinguish rollout control from security enforcement and include server-side checks and lifecycle. **Follow-up:** How would you disable a flag if a write has already changed persisted data?
3. **Very Hard:** A new event field is required, but several consumers deploy independently and messages are retained. Design the transition. **Expected answer shape:** Map producers/consumers and retention, define tolerant parsing/default semantics, deploy order, telemetry, and retirement. **Follow-up:** What if one consumer is externally owned and cannot be upgraded on schedule?
4. **Very Hard:** A deployment fails after backfill but before contract. Explain rollback versus roll-forward decisions. **Expected answer shape:** Inspect data compatibility, write patterns, invariant status, and recovery options; select a reversible step and communicate risk. **Follow-up:** What migration evidence would you require before enforcing a non-null constraint?