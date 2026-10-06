# Day 04: Estimation and Back-of-the-Envelope Math

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> · Previous: <a href="day-03-requirements-and-quality-attributes.md">Day 03</a> · Next: <a href="day-05-latency-throughput-and-queues.md">Day 05</a></nav>

## What You Will Learn Today

By the end of this lesson, you can:

- Estimate average and peak requests per second from daily activity.
- Estimate storage growth and network bandwidth with units.
- Apply workload mix, retention, and headroom assumptions explicitly.
- Use estimates to identify likely constraints without pretending they are benchmarks.

## Prerequisites

- [Day 03: Functional Requirements, Quality Attributes, and Constraints](day-03-requirements-and-quality-attributes.md)
- Basic arithmetic, multiplication, and unit conversion.

## Quick Vocabulary Card

- **Request rate:** Requests processed per unit time, commonly requests per second (RPS).
- **Peak-to-average ratio:** Peak rate divided by average rate over a stated interval.
- **Payload:** Data transferred for one operation, measured in bytes or a multiple such as MB.
- **Retention:** The duration for which data remains stored.
- **Headroom:** Capacity reserved above expected demand for bursts, growth, or failures.
- **Order of magnitude:** A rough scale estimate, such as thousands rather than millions.

## Core Concepts

Estimation is a way to test whether a proposed shape of system is plausible. It does not predict exact machine counts. Real capacity depends on hardware, implementation, data distribution, caching, concurrency, software limits, and failure modes. The [AWS Performance Efficiency pillar](https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/welcome.html) discusses measuring and adapting workloads; in an interview, keep calculations tied to a stated decision.

### Convert activity into rates

Suppose a messaging service has 2,000,000 daily active users, each sending an average of 20 messages per day. Assume traffic is distributed across 24 hours for the average:

$$\text{messages/day} = 2{,}000{,}000\ \text{users} \times 20\ \frac{\text{messages}}{\text{user·day}} = 40{,}000{,}000\ \text{messages/day}$$

$$\text{average writes/s} = \frac{40{,}000{,}000\ \text{messages}}{86{,}400\ \text{s/day}} \approx 463\ \text{messages/s}$$

If the assumed peak-to-average ratio is 5, then:

$$\text{peak writes/s} \approx 463\ \text{writes/s} \times 5 = 2{,}315\ \text{writes/s}$$

That ratio is an assumption, not a universal property of messaging. If traffic clusters around business hours or a news event, a short-window peak may be higher. State the interval represented by “peak,” because one-minute and daily peaks answer different capacity questions.

Include read/write mix separately. If each message produces an average of three recipient inbox reads or updates, the resulting work may exceed the message-write count. Avoid silently treating one product action as one backend operation.

### Estimate storage growth

Assume each stored message requires 1 KB of payload and metadata before indexes, replicas, and storage encoding. Daily logical growth is:

$$40{,}000{,}000\ \text{messages/day} \times 1\ \text{KB/message} = 40{,}000{,}000\ \text{KB/day} \approx 40\ \text{GB/day}$$

Using decimal units here, $1\ \text{GB}=10^9\ \text{bytes}$ and $1\ \text{KB}=10^3\ \text{bytes}$. Over 30 days, this is about $1.2\ \text{TB}$ of logical message data. If retention is 180 days, a steady-state estimate is approximately $40\ \text{GB/day} \times 180\ \text{days}=7.2\ \text{TB}$, before indexes, replicas, backups, compression, and growth. Those factors must be considered, but do not multiply by an unexplained “storage factor.”

### Estimate bandwidth

For a simplified write-ingress estimate, use rate times average payload:

$$2{,}315\ \text{writes/s} \times 1\ \text{KB/write} \approx 2.315\ \text{MB/s}$$

This excludes protocol overhead, acknowledgments, replication traffic, retries, and recipient fan-out. For reads, use read rate and response size; the direction matters. Convert to bits per second by multiplying bytes per second by 8. Name whether the estimate covers application payload, network wire traffic, or a specific link.

### Use estimates to guide questions

Ask which assumptions drive the result. In the example, doubling daily message volume doubles average writes and logical storage. Doubling the peak ratio changes peak capacity but not daily retained storage. Increasing retention changes steady-state storage but not ingestion bandwidth. This sensitivity check helps identify what to validate first.

Capacity also needs headroom. If an estimate implies 2,315 peak writes/s, designing exactly for that rate leaves no margin for bursts, failover, uneven distribution, or deployment overhead. A percentage reserve may be a starting planning convention, but choose it using risk, growth, and measured behavior. Do not turn it into a magic constant.

## Common Mistakes and Interview Traps

- Mixing users, requests, records, bytes, and seconds in one calculation without units.
- Dividing by a day when the traffic is concentrated in a much shorter active window.
- Treating average rate as peak load or using a peak multiplier without identifying its interval.
- Counting only primary requests and ignoring fan-out or background work.
- Calling logical payload size “total storage” while omitting indexes, replicas, retention, and backups.
- Producing a precise server count from assumed data instead of identifying what must be benchmarked.

## Tricky Points

Decimal and binary units differ: GB commonly means $10^9$ bytes, while GiB means $2^{30}$ bytes. Interviews usually tolerate rounded estimates when units are clear. Also, traffic peaks and storage steady state are separate: an event can create a brief capacity spike without immediately changing the long-term average, while retention steadily accumulates historical data.

## Practical Exercise

**Goal:** Estimate daily storage and average/peak requests for a messaging workload.

**Inputs:** Assume 500,000 daily active users, 30 messages per user per day, 1.5 KB stored per message, 2.5 recipient-side reads or updates per sent message, 60-day retention, and a peak-to-average ratio of 4.

**Constraints:** Use 86,400 seconds/day and decimal KB/GB. Keep application payload separate from wire overhead and replicas.

**Edge cases:** State how multiple recipients, deleted messages, attachments, and burst peaks change the estimate.

**Acceptance criteria:** Show messages/day, average and peak send RPS, a separate recipient-work estimate, logical daily and 60-day storage, and at least one bandwidth estimate with units. List the three assumptions that most affect capacity. Do not convert the estimate into a claimed machine count.

## Summary

Estimate activity rates, workload mix, payload transfer, and retained data independently. Show units and assumptions at every step. Peak-to-average ratio, fan-out, retention, and data size can change different resources in different ways. Use order-of-magnitude results to frame measurements and design questions, not to claim exact capacity.

## Cheat Sheet

- Average RPS = daily operations ÷ 86,400 seconds/day.
- Peak RPS = average RPS × stated peak-to-average ratio.
- Storage growth = records/day × bytes/record × retention days.
- Bandwidth = operations/second × bytes/operation; bytes/s × 8 = bits/s.
- Include payload mix, fan-out, retention, replication/index overhead, bursts, and headroom where relevant.
- **Common Pitfalls:** unitless math; average treated as peak; unexplained multipliers; ignoring fan-out; confusing logical with provisioned storage; invented instance counts.

## Interview Questions

1. **[Hard]** A service receives 25 million writes/day. Estimate average RPS and explain why that is not peak capacity. **Expected answer shape:** calculation with units, peak interval assumption, and a request for workload shape. **Follow-up:** What evidence would you use to replace a guessed peak ratio?
2. **[Hard]** Given records/day, bytes/record, and retention, estimate storage and identify what the result omits. **Expected answer shape:** formula, unit handling, steady-state interpretation, and clearly named overheads. **Follow-up:** Which omitted factor changes capacity most if every record is replicated three times?
3. **[Very Hard]** Your average workload fits a single service tier, but a ten-minute event creates a much higher peak and a 180-day retention policy. Explain how you use these numbers to choose what to investigate. **Expected answer shape:** separate burst compute/network demand from accumulated storage, perform sensitivity checks, discuss headroom and measurement, and avoid unsupported machine sizing. **Follow-up:** Which assumption would you validate first if benchmark time were limited, and why?