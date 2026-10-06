# Day 3: Replication, Partitioning, and Consistency

## Data scaling

1. **Replication:** Copies data for read scale/availability; asynchronous replication can lag, affecting read-after-write behavior.
2. **Partitioning/sharding:** Splits data by key/range to distribute size and load; key skew and cross-partition access are central costs.
3. **Transactions:** Group database changes to preserve invariants; transaction scope, locking, and isolation affect concurrency and throughput. [Replication](../../SystemDesign/system-design-lectures/day-15-replication-and-read-scaling.md) | [Sharding](../../SystemDesign/system-design-lectures/day-16-partitioning-and-sharding.md) | [Transactions](../../SystemDesign/system-design-lectures/day-17-transactions-and-data-integrity.md)

## Consistency and derived data

1. **Consistency models:** State the user-visible guarantee, such as read-your-writes or eventual convergence; CAP concerns trade-offs during network partitions.
2. **Search/read models:** A search index or projection may lag behind its source of truth; define update and repair paths.
3. **Lifecycle and recovery:** Retention, backups, restore tests, and recovery objectives are separate from replication. [Consistency](../../SystemDesign/system-design-lectures/day-18-consistency-models-and-cap.md) | [Search](../../SystemDesign/system-design-lectures/day-19-search-and-read-models.md) | [Backup/recovery](../../SystemDesign/system-design-lectures/day-20-data-lifecycle-backup-and-recovery.md) | [Multi-region](../../SystemDesign/system-design-lectures/day-21-multi-region-design.md)

## Tricky points

1. **Scaling data**
	1.1 **Replication lag:** A replica read may not include the last write; route freshness-sensitive reads accordingly.
	1.2 **Shard key:** A skewed/hot key can overload one partition and erase expected scale gains.
	1.3 **Transactions:** Wider scope can increase lock duration and contention; keep invariants and boundaries explicit.
2. **Consistency and recovery**
	2.1 **CAP:** It is not “choose any two” in normal operation; the trade-off is framed under a network partition.
	2.2 **Search index:** It is commonly a derived view, not the authoritative transactional record.
	2.3 **Replica versus backup:** Replication can copy accidental deletion/corruption; backups need tested restore paths.
	2.4 **Multi-region:** Lower latency/greater resilience comes with replication, conflict, residency, and operational complexity.