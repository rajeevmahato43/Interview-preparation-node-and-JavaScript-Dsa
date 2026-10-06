# Day 3: Replication, Partitioning, Consistency, and Search

Quick review of main-course lectures 15–20. Covers replication topologies, read-after-write consistency, database sharding strategies, transaction isolation levels, CAP/PACELC theorems, CQRS read models, and disaster recovery metrics.

## Replication, sharding, and transactional integrity

**1. Database replication topologies and read-after-write**

- *Single-Leader (Primary-Replica):* All writes go to Leader; Leader replicates to Read Replicas asynchronously or semi-synchronously. Allows scaling read throughput.
- *Replication Lag & Read-Your-Writes Consistency:* If a user edits their profile and immediately views it, reading an asynchronous replica shows stale data. Solutions: route the modifying user's reads to the Primary for 60 seconds, or track transaction log sequence numbers (LSN).
- *Leaderless Quorum ($R + W > N$):* In Dynamo-style stores (Cassandra), writing to $W$ replicas and reading from $R$ replicas guarantees at least one replica contains the latest write if $R + W > N$ (where $N$ is total replicas).

**2. Sharding and partition key selection**

Horizontal partitioning splits rows across independent database nodes.
- *Hash-Based Partitioning:* Hash of Shard Key modulo $N$ distributes writes uniformly, preventing hotspots.
- *Range-Based Partitioning:* Groups consecutive ranges together (e.g. date intervals). Enables range scans, but writes for current time hotspot on the latest partition.
- *Scatter-Gather Queries:* Queries omitting the Shard Key must execute across all shards in parallel and merge results at the coordinator, drastically increasing latency.

```text
User Table Partitioned by user_id:
Shard 1: user_id % 3 == 0  [Server A]
Shard 2: user_id % 3 == 1  [Server B]
Shard 3: user_id % 3 == 2  [Server C]
```

**3. Transaction isolation levels and write skew**

ACID transactions protect data invariants.
- *Read Committed:* Prevents dirty reads; read queries see only committed data.
- *Repeatable Read (Snapshot Isolation):* Readers see a consistent snapshot of the DB at transaction start; prevents non-repeatable reads.
- *Serializable:* Strictest isolation; prevents phantom reads and *Write Skew* (e.g., two doctors simultaneously going off-call when at least one doctor is required).
- *Two-Phase Commit (2PC):* Distributed protocol with prepare and commit phases; blocking protocol—coordinator crash leaves participants locked.

[Replication and read scaling](../../SystemDesign/system-design-lectures/day-15-replication-and-read-scaling.md) | [Partitioning and sharding](../../SystemDesign/system-design-lectures/day-16-partitioning-and-sharding.md) | [Transactions and data integrity](../../SystemDesign/system-design-lectures/day-17-transactions-and-data-integrity.md)

## Consistency models, search, and recovery

**1. Consistency models and the PACELC theorem**

- *CAP Theorem:* Under a network partition ($P$), a distributed system must choose between Availability ($A$, every non-failing node returns non-error response) and Consistency ($C$, linearizability / single up-to-date copy).
- *PACELC Theorem:* Expands CAP to non-partition states: If Partition ($P$), choose Availability ($A$) or Consistency ($C$); Else ($E$), choose Latency ($L$) or Consistency ($C$). (e.g. MongoDB is PC/EC; Cassandra is PA/EL).

**2. CQRS and derived search models (Inverted Index)**

Command Query Responsibility Segregation (CQRS) separates transactional write storage from specialized read views. Write changes are captured via Change Data Capture (CDC, e.g. Debezium reading Postgres WAL) and streamed via Kafka to Elasticsearch to build tokenized inverted indexes for full-text search.

```text
[Client Write] ---> [PostgreSQL Primary]
                           | (WAL / CDC Stream via Debezium)
                           v
                       [Kafka Event Bus]
                           |
                           v
                     [Elasticsearch] <--- [Client Search Read]
                     (Inverted Index)
```

**3. Data lifecycle: RPO, RTO, and point-in-time recovery**

- *RPO (Recovery Point Objective):* Maximum acceptable age of data lost during an outage (e.g. RPO = 5 minutes implies lost transactions cannot exceed 5 min).
- *RTO (Recovery Time Objective):* Maximum acceptable downtime to restore system operation (e.g. RTO = 1 hour).
- *Point-in-Time Recovery (PITR):* Restores full base backup plus replaying archived Write-Ahead Logs (WAL) up to the exact millisecond before failure.

[Consistency models and CAP](../../SystemDesign/system-design-lectures/day-18-consistency-models-and-cap.md) | [Search and read models](../../SystemDesign/system-design-lectures/day-19-search-and-read-models.md) | [Data lifecycle and backup](../../SystemDesign/system-design-lectures/day-20-data-lifecycle-backup-and-recovery.md)

## Tricky points

1. **Replication and sharding**
   **1.1 Hotspotting celebrity keys:** Sharding tweets by `author_id` causes the shard hosting a celebrity with 100M followers to experience extreme read/write hotspots; split celebrity traffic using fan-out on read or dedicated caching tiers.
   **1.2 Replication is not backup:** Asynchronous replication propagates human errors immediately (e.g. `DROP TABLE users` instantly replicates to all read replicas); immutable point-in-time snapshots are mandatory.

2. **Distributed consistency**
   **2.1 Eventual consistency guarantees:** "Eventual consistency" offers no bounds on when replicas converge; unless paired with monotonic reads or bounded staleness, successive reads by the same client may jump backward in time.
   **2.2 2PC coordinator lock-in:** In Two-Phase Commit, if the coordinator fails during Phase 2 after participants vote YES, all participant nodes must hold database locks indefinitely, stalling throughput across the cluster.