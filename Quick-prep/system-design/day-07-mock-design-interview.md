# Day 7: Real-Time Messaging, Cloud Storage, and Senior Interview Capstone

Quick review of main-course lectures 40–42. Covers real-time WebSocket connection architectures, message delivery receipts, block-level delta sync and content-addressable storage for cloud drives, and the senior interview scoring rubric.

## Real-time messaging and cloud file storage

**1. Real-time messaging architecture (WhatsApp / Slack)**

- *WebSocket Connection Gateways:* Maintain persistent, stateful TCP connections with active mobile/desktop clients.
- *Session Registry:* Redis cluster mapping `user_id -> gateway_server_ip`.
- *Message Routing Flow:* Sender sends message over WebSocket to Gateway 1. Gateway 1 queries Redis session registry for recipient's gateway; routes message via Redis Pub/Sub or Kafka topic to Gateway 2; Gateway 2 pushes to recipient.
- *Message Storage:* Partition messages in Cassandra or ScyllaDB:
  - `PARTITION KEY (channel_id)`
  - `CLUSTERING KEY (message_id DESC)` (time-based UUIDv7 / Snowflake ID for chronological ordering).
- *Delivery Status Receipts:* `SENT` (stored in DB) $\rightarrow$ `DELIVERED` (received by client device) $\rightarrow$ `READ` (opened in active UI). Offline users receive silent push notifications via APNs/FCM.

```text
[User A] ===(WebSocket)===> [Gateway 1] ---> [Message DB (Cassandra)]
                                 |
                          [Redis Pub/Sub]
                                 |
[User B] <===(WebSocket)==== [Gateway 2]
```

**2. Distributed cloud file storage (Google Drive / Dropbox)**

- *Chunking and Content-Addressable Storage (CAS):* Split large files into fixed 4MB binary chunks. Hash each chunk using SHA-256. If a chunk hash already exists in global storage, skip upload (client-side deduplication).
- *Separation of Storage and Metadata:*
  - *Metadata Database (PostgreSQL):* Stores folder hierarchies, file names, permissions, and chunk lists (`file_id, chunk_index, chunk_hash`).
  - *Block Store (Amazon S3):* Stores raw immutable 4MB binary blobs named by their SHA-256 hash.
- *Delta Sync Algorithm:* On file edit, client re-hashes local 4MB chunks; uploads only the modified chunks rather than re-uploading the entire 1GB file.

```text
1. Client splits 100MB file into 25 x 4MB chunks -> Hashes each chunk with SHA-256
2. Client queries Metadata Service: "Do chunks [h1..h25] exist?"
3. Backend: Chunks [h1..h23] exist; upload only [h24, h25] to S3 via Pre-Signed URLs
4. Metadata DB updates chunk mapping for new file version
```

[Messaging case study](../../SystemDesign/system-design-lectures/day-40-case-study-messaging.md) | [File storage case study](../../SystemDesign/system-design-lectures/day-41-case-study-file-storage.md)

## Senior interview capstone and execution rubric

**1. End-to-end 45-minute interview pacing breakdown**

- *Minutes 0–5:* Functional scope, traffic estimates (QPS, storage, bandwidth), concrete exclusions.
- *Minutes 5–15:* Core API endpoints, database schema entities, and high-level block diagram.
- *Minutes 15–32:* Deep dive into 2–3 hardest architectural problems (data partitioning keys, concurrency locks, caching consistency, failover).
- *Minutes 32–40:* Scale bottlenecks, cross-region replication, circuit breakers, and observability.
- *Minutes 40–45:* Trade-off recap, unanswered questions, and system failure mode summary.

**2. Senior candidate evaluation dimensions**

1. *Proactive Leadership:* Drives the conversation without waiting for hints.
2. *Quantitative Justification:* Backs architectural choices with math ("We generate 50GB daily, so relational sharding is unnecessary for 3 years").
3. *Trade-off Awareness:* Acknowledges what each technology sacrifices ("Cassandra gives us massive write throughput, but we forfeit ACID transactions and ad-hoc SQL joins").
4. *Failure Realism:* Anticipates partial network splits, disk full errors, and poisoned queue messages.

[Capstone and interview review](../../SystemDesign/system-design-lectures/day-42-capstone-and-interview-review.md)

## Tricky points

1. **Messaging architectures**
   **1.1 Global message ordering trap:** Achieving strictly serialized global message order across all users requires a single coordinator bottleneck; in chat, order is only required *per conversation* (`channel_id`), enabling partition-level parallelism.
   **1.2 Zombie WebSocket connections:** Mobile devices frequently drop network connectivity silently without sending TCP FIN/RST packets; enforce periodic heartbeats/ping-pong frames and terminate idle connections after 60 seconds.

2. **Cloud storage and synchronization**
   **2.1 Metadata vs Blob transaction gap:** If a client uploads chunks to S3 but crashes before committing metadata to PostgreSQL, orphaned blobs accumulate in S3; run async reconciliation cron jobs to garbage-collect unreferenced chunks after 24 hours.
   **2.2 Sync conflicts:** When two offline users edit the same document and reconnect simultaneously, automatic block merges corrupt data; fork conflicting edits into branch files (e.g. `document_conflict_userB.docx`) and prompt user resolution.