# Content Rules

Use these rules for every lecture, explanation, review, or study resource created for this project.

## Course planning

Before creating day files, identify the full topic surface, prerequisites, major concepts, advanced areas, practical applications, common mistakes, and likely interview areas. Divide the material into a sensible progression. Do not stop at beginner syntax when the course is intended for mid-to-senior interviews.

Use one course directory with stable Markdown filenames such as `day-01-topic.md`, `day-02-topic.md`, and `day-03-topic.md`. Keep each day focused enough to study in one sitting and link to earlier or later days when concepts depend on one another.

## Required lecture shape

Every day file must contain the following sections in this order:

1. Day title and learning outcomes.
2. Prerequisites or links to earlier day files.
3. Core concepts, with basic material explained briefly.
4. Detailed explanations of advanced, confusing, or interview-sensitive concepts.
5. Examples and traces, including relevant JavaScript, Node.js, or DSA connections.
6. Common mistakes and interview traps.
7. A `Tricky Points` section only when the topic has meaningful traps, edge cases, exceptions, or confusing behavior.
8. A practical exercise or verification task when appropriate.
9. A `Summary` section covering all important points from the day.
10. A compact `Cheat Sheet` section for quick revision.
11. An `Interview Questions` section and follow-up prompts governed by [interview-rules.md](interview-rules.md).

Prefer explanations that answer what happens, why it happens, when it matters, and how to verify it. Distinguish facts, conventions, heuristics, and opinions. Define specialized terms at first use and keep terminology consistent across domains.

## Depth and audience

Assume the learner knows basic programming but is preparing for mid-to-senior interviews. Keep familiar basics short enough to refresh memory, then spend more space on internals, interactions, tradeoffs, and failure modes. Use plain language and explain unavoidable jargon. Do not use senior-sounding terms as a substitute for causal explanations. When a topic has junior, mid, and senior interpretations, label the depth explicitly.

## Language and focus

- Use direct, everyday language. Prefer "only", "just", "usually", "can", and "must" over formal words such as "merely", "henceforth", "aforementioned", or "utilize".
- Explain the behavior first: what happens, why it happens, and what the learner should do with that knowledge. Keep dictionary-style definitions to one or two sentences unless the definition itself is the difficult part.
- Prefer precise concrete wording over impressive or abstract wording. State the condition, boundary, assumption, or exception that makes a claim true.
- Include information only when it helps the learner understand the day's topic, use it in Node.js work, debug a realistic problem, or answer a likely interview question. Move unrelated background, future-topic previews, and repeated explanations to the appropriate later lecture or remove them.
- Keep one strong example or trace for each important behavior. Do not add several examples that prove the same point.
- Use short paragraphs and small sections. Combine overlapping sections when the same rule has already been explained.
- Define a technical term at first use, then use the same term consistently. Do not introduce jargon only to sound advanced.
- A lecture should be complete enough to teach the topic, but not encyclopedic. As a default, prefer a focused study unit over maximum coverage.

## Organization

Use stable headings, short sections, tables only when comparison is clearer, and relative links to related material. Keep a lecture separate from its solution set when the user requests separate files. Do not invent unsupported requirements or silently broaden a topic.

## Quality bar

Examples must be internally consistent, edge cases must be named, and claims about performance must include the relevant assumptions. Explain complexity as a function of input size where applicable. Call out behavior that differs between browser JavaScript, Node.js, databases, and libraries. The cheat sheet must condense the day's definitions, rules, comparisons, complexity, commands, patterns, or decision points without replacing the full explanation.