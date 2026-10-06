# Quick-Prep Course Rules

Use these rules only for the standalone interview sprints under [Quick-prep](../Quick-prep/README.md). They intentionally use a shorter structure than the comprehensive courses. Accuracy, originality, safe examples, and relevant domain rules still apply.

## Purpose and audience

- Each track is a seven-day, high-yield interview-preparation sprint, not a replacement for the full course.
- Assume the learner has prior exposure to the subject. Select the concepts, traps, and decisions most likely to change an interview answer or implementation.
- Keep explanations short and useful. Omit history, broad background, repeated definitions, optional technologies, and other content that does not directly improve interview performance.
- Do not promise mastery from a week. JavaScript, Node.js, DSA, and system design tracks target advanced interview readiness through focused revision and practice. React and Angular target a backend developer who can discuss core terminology and contribute to ordinary application work, not a framework specialist.

## Scope and structure

- Each track has one roadmap and exactly seven numbered day lectures.
- Combine related concepts from the full-course lectures into seven daily topic groups. Use the full roadmap's declared topics as a coverage checklist; do not omit a roadmap topic just to keep lessons short.
- Organize each day by subject topic, not by source-lecture number or a list of source documents.
- Keep the existing `##` main headings unnumbered. Under each, number topics and subtopics (for example, `1. Variables`, `1.1 let`, `1.2 const`, `1.3 var`).
- Give each subtopic a one- or two-line definition/summary and a compact example, normally inline. Use a correct and an incorrect example when the difference is interview-relevant.
- Put a relevant relative link beside the topic or group so learners can open the full-course explanation. Links supplement the summary; they do not replace topic coverage.
- End each day with one `## Tricky points` section. Group traps by topic with nested numbering and brief consequences.
- Do not add separate worked-example, practice, interview-question, summary, cheat-sheet, prerequisite, or source-lecture sections unless the user explicitly requests them. Do not add filler or advanced detail outside the quick-prep scope.
- The final `## Tricky points` section should collect the likely confusions and failure cases for that day's topics; it must be the final section in the file.
- Day 7 can be a compact synthesis of its assigned topics, but must follow the same topic-wise format and finish with `## Tricky points`.

## Track-specific calibration

- **JavaScript:** prioritize language semantics, closures and `this`, object behavior, promises, scheduling, and backend-relevant edge cases.
- **Node.js:** prioritize runtime and event loop, HTTP/Express behavior, API and security judgment, operational reliability, and practical database fundamentals. Include only commonly asked MongoDB and PostgreSQL concepts; skip advanced database internals and vendor-specific deployment details.
- **DSA:** emphasize recognizing patterns, stating invariants, selecting a data structure, explaining correctness and complexity, and communicating under time limits. Use JavaScript and include relevant edge cases.
- **System design:** emphasize a repeatable interview flow, explicit assumptions, workload, API/data choices, bottlenecks, failures, and trade-offs; use one-day case practice rather than a component encyclopedia.
- **React and Angular:** build interview vocabulary and practical competence for a backend developer. Cover the core component, state, data-flow, routing, forms, async, and debugging models. Clearly mark advanced framework-specialist topics out of scope.

## Quality checks

- A candidate should be able to revise each day's key topics quickly without needing to open the full course first.
- Definitions must state the key behavior, not just repeat a term; examples and edge cases must be correct.
- Tricky points must state the condition and consequence, not merely name a buzzword.
- Deep links must resolve to the relevant full-course lecture or authoritative documentation.
- A learner should be able to use the sprint on its own; cross-links provide depth when needed.
- Do not add material just to make days equal in length. Prioritize likely interview value over uniformity.