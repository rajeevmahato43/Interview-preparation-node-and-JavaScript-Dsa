# Day 7: Messaging, File Storage, and Interview Review

## Messaging and file storage

1. **Messaging:** Define conversations, delivery/ordering scope, offline storage, fanout, and reconnect behavior; “real time” does not mean reliable by itself.
2. **File storage:** Separate metadata from blobs; define upload/download authorization, object durability, versioning/deletion, and recovery.
3. **Capstone review:** Present requirements, estimate, API/data, architecture, critical flows/failures, and trade-offs within interview time. [Messaging](../../SystemDesign/system-design-lectures/day-40-case-study-messaging.md) | [File storage](../../SystemDesign/system-design-lectures/day-41-case-study-file-storage.md) | [Capstone](../../SystemDesign/system-design-lectures/day-42-capstone-and-interview-review.md)

## Tricky points

1. **Messaging**
	1.1 **Ordering:** Define whether order is per user, conversation, partition, or global; global order is costly.
	1.2 **Reconnect:** Replays need cursors/acknowledgments and duplicate-safe clients.
2. **File storage**
	2.1 **Signed access:** Expiring URLs delegate time-limited access; authorization and revocation semantics still matter.
	2.2 **Metadata and blobs:** Database metadata and object storage writes are separate systems; failure between them needs cleanup/reconciliation.
3. **Interview close**
	3.1 **Trade-offs:** Tie each choice to requirements/workload and name its cost/failure behavior.
	3.2 **Scope control:** Deep-dive into the highest-risk path rather than listing every optional component.