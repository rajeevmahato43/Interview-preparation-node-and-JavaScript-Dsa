# Day 40: Case Study - Messaging

<nav aria-label="Lecture navigation">
  <a href="../system-design-roadmap.md">Roadmap</a> ·
  <a href="day-39-case-study-social-feed.md">Previous: Day 39</a> ·
  <a href="day-41-case-study-file-storage.md">Next: Day 41</a>
</nav>

## What You Will Learn Today

Design a persistent one-to-one and small-group messaging service. You will separate durable message acceptance from live socket delivery, scope ordering to a conversation, support offline synchronization, and avoid promising end-to-end exactly-once delivery when networks and devices can disconnect.

## Prerequisites

- [Day 06: Networking and Request Lifecycle](day-06-networking-and-request-lifecycle.md)
- [Day 13: Asynchronous Processing and Message Queues](day-13-queues-and-asynchronous-processing.md)
- [Day 15: Replication and Read Scaling](day-15-replication-and-read-scaling.md)
- [Day 18: Consistency Models and CAP](day-18-consistency-models-and-cap.md)
- [Day 23: Idempotency, Deduplication, and Exactly-Once Claims](day-23-idempotency-and-message-delivery.md)
- [Day 24: Ordering, Coordination, and Distributed Locks](day-24-ordering-and-coordination.md)

## Quick Vocabulary Card

- **Persistent connection:** A long-lived client/server channel, commonly WebSocket, used for interactive delivery.
- **Conversation sequence:** A monotonically assigned order within one conversation; it does not imply a global order across all chats.
- **Acknowledgment:** A signal for a specific stage, such as server persistence, recipient device receipt, or user read.
- **Reconnect cursor:** The last sequence a client has processed, used to fetch missed messages.
- **Presence:** Ephemeral best-effort state such as online or last-seen, distinct from durable message history.

## Core Concepts

### Define a narrow guarantee

Assume authenticated users send text messages in direct and small group conversations. The service stores history, delivers to connected devices quickly, and lets offline clients synchronize after reconnect. Exclude voice/video calls, end-to-end encryption design, public channels, and large group fan-out from the baseline; each changes the design materially.

Promise: once the server returns an accepted response, the message is durably stored and has a conversation sequence. The service makes best-effort live delivery and retries/synchronizes for authorized devices. Clients may see duplicate transport frames, so deduplicate by message ID. The server provides order within a conversation according to assigned sequence, not a total order across conversations or across disconnected devices' local clocks. “Delivered” and “read” require separate definitions and acknowledgments.

### Workload sketch and boundaries

Assume 50 million daily users send 40 messages each: 2 billion/day, about 23,000/second average and 115,000 at a 5x peak. At 1 KB each, raw growth is about 2 TB/day before indexes, replicas, and attachments. Retention and group fan-out affect capacity.

Separate socket gateways, membership checks, durable message/sequence storage, broker routing, history reads, and ephemeral presence. These can begin as modules in fewer deployables.

### API and data model

An HTTP or socket command can use the same envelope:

```text
SendMessage(conversationId, clientMessageId, body, clientSentAt)
Accepted(messageId, conversationSequence, serverReceivedAt)
```

History can page before a sequence or fetch after a reconnect cursor. Authenticate and verify membership on sends and reads.

Store conversation, membership, and message records. Enforce unique `(conversation_id, sequence)` and scoped `(sender_id, client_message_id)`. Allocate sequence with message persistence transactionally or through one partition owner; client clocks are not authoritative.

### Send, persist, and deliver flow

The gateway validates size, membership, and idempotency, then commits message, sequence, and outbox event. Only afterward it acknowledges. A publisher routes by conversation to recipient gateways; devices dedupe by message ID and acknowledge receipt. Offline clients fetch after their last contiguous sequence.

Order within a conversation by committed sequence, using ordered partition processing or client gap detection/resync. Conversations run concurrently; one hot conversation may bottleneck. Small groups can fan out to members; large groups need another strategy.

Presence is approximate: heartbeat leases expire, and “online” does not prove delivery. Track per-device cursors when devices synchronize independently.

### Failure paths and scoped guarantees

1. **Connection drops before server acknowledgment:** The sender cannot know whether the command committed. Retry with the same client message ID; the server returns the existing message rather than inserting a duplicate. If the key is retained only for a limited window, define what happens after expiry.
2. **Commit succeeds, broker publish fails:** An outbox publisher retries. The message is durable even if live delivery is delayed; reconnect history still repairs the gap. Idempotent consumers prevent duplicate push frames where possible.
3. **Gateway sends a frame but device acknowledgment is lost:** Redelivery may duplicate the frame. Client deduplication by stable message ID prevents duplicate display. Do not interpret server socket write completion as user receipt.
4. **Recipient is offline or loses history cursor:** Store history durably and let the authorized client fetch after its last sequence. If a cursor predates retention, return an explicit resync boundary rather than silently skipping history.
5. **Membership revoked during send:** Define the authorization check's commit boundary. A transaction or versioned membership check can reject stale commands; queued delivery must also re-check access when privacy demands it.

The guarantee is durable acceptance and per-conversation server order within the retained history window, plus at-least-once delivery attempts and client deduplication. It is not exactly-once device delivery or guaranteed human reading. Specify retention, ordering during retries, and behavior for messages accepted just before a member leaves.

### Operations and security

Monitor connections, acceptance latency, sequence contention, outbox age, delivery lag, reconnects, storage growth, and hot conversations. Backpressure slow sockets and bound message size/rate. Encrypt transport, authorize access, use short-lived tokens, and redact content. End-to-end encryption changes search, moderation, and recovery options.

## Common Mistakes and Interview Traps

- Saying “WebSockets provide messaging reliability”; they provide a transport channel, not durable delivery.
- Claiming exactly-once delivery across storage, broker, gateway, and device.
- Ordering by client timestamps or assuming global order is necessary.
- Acknowledging before durable commit, then losing accepted messages on crash.
- Treating online presence as proof that the device received content.
- Ignoring slow consumers, reconnect storms, and message retention.

## Tricky Points

“Delivered” is ambiguous. Server accepted, broker processed, gateway wrote bytes, device persisted, and user read are separate states. Expose only the states the system can observe. Ordering also has a scope: the chosen sequence gives server order within a conversation, but does not resolve which of two offline clients' simultaneous sends was “really first”; the server's commit order is the policy.

## Practical Exercise

**Goal:** Design message send and reconnect for direct and small-group conversations.

**Input/context:** Use 50 million daily users, 40 messages per user daily, multiple devices, intermittent mobile networks, and seven-day minimum history retention.

**Constraints:** State persistence, ordering, delivery, receipt, and read guarantees separately. Include socket routing, data model, idempotency, and reconnect cursor behavior.

**Edge cases:** Lost sender acknowledgment, broker outage after commit, duplicate device frame, offline recipient, sequence gap, membership removal, and slow socket.

**Acceptance criteria:** Trace one accepted message to online and offline recipients, state the scope of ordering, show how each retry avoids or tolerates duplicates, identify two failure paths, and propose operational signals.

## Summary

Persist and sequence before acknowledging acceptance. Use a durable outbox/broker path to route messages to connection gateways, and use stored history plus cursors to repair offline delivery. Scope ordering per conversation, make delivery acknowledgments stage-specific, and rely on stable IDs for duplicate suppression. Presence remains approximate; slow clients and retention require explicit handling.

## Cheat Sheet

- **Acceptance:** Durable commit first; retry with stable client message ID.
- **Ordering:** Server-assigned sequence per conversation, not global timestamp order.
- **Delivery:** At-least-once attempts; device dedupe; history is recovery path.
- **Realtime:** Gateways/sockets for low latency, not as durable storage.
- **Common Pitfalls:** Equating socket write with receipt; unbounded buffers; trusting client time; vague “delivered” state.

## Interview Questions

1. **Hard:** Explain the difference between accepted, delivered, and read. **Expected answer shape:** Define observable boundaries and persistence needed for each. **Follow-up:** Which state can the service not prove?
2. **Hard:** Two devices retry the same send after a lost acknowledgment. **Expected answer shape:** Describe stable client ID, uniqueness scope, response replay, and retention. **Follow-up:** How do you handle key reuse with different message content?
3. **Very Hard:** A conversation partition is delayed while later messages are available on another gateway. **Expected answer shape:** Explain sequence ownership, ordered processing or gap buffering, timeout/resync behavior, and hot-key tradeoff. **Follow-up:** What changes for a group with millions of members?
4. **Very Hard:** Define a delivery guarantee that survives gateway crashes but does not claim exactly once. **Expected answer shape:** Trace durable commit, outbox, redelivery, client dedupe, offline history, and acknowledgment stages. **Follow-up:** How would end-to-end encryption alter moderation and recovery?