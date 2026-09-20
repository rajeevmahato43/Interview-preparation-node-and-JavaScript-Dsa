# Interview Preparation Instruction System

This directory contains project and LLM instructions for creating the interview-preparation system. It is not the lecture curriculum itself. The root [AGENTS.md](../AGENTS.md) requires these rules for every chat in this workspace.

## Audience and focus

The system targets mid-to-senior interviews, with backend Node.js as the primary role focus and JavaScript treated as a deep language and runtime subject. The covered domains are JavaScript, Node.js, Express, MongoDB, PostgreSQL, and data structures and algorithms.

## Lecture output

When the user asks for a course or lecture, create Markdown files only. First plan the complete course so important concepts and likely interview areas are not omitted. Then split the course into a directory of day-wise files using names such as `course/day-01-topic.md`.

Each day file must teach the topic in clear, normal language, keep basic material concise, explain difficult material in depth, include useful examples, provide a summary, provide a cheat sheet, and finish with an `Interview Questions` section. A `Tricky Points` section is added when the day contains meaningful traps, edge cases, exceptions, or confusing behavior.

## Instruction precedence

1. Root [AGENTS.md](../AGENTS.md) defines workspace boundaries.
2. The shared rules below apply to all interview-preparation content.
3. The relevant domain file adds topic-specific requirements.
4. A user request may narrow the requested output, but it does not remove safety, accuracy, originality, or repository-boundary requirements.

## Shared rules

- [content-rules.md](content-rules.md): depth, structure, terminology, and teaching quality.
- [interview-rules.md](interview-rules.md): lecture-first explanations followed by interview questions and tradeoffs.
- [example-rules.md](example-rules.md): code, SQL, pseudocode, testability, and secret-handling requirements.
- [accuracy-rules.md](accuracy-rules.md): sources, uncertainty, compatibility, and version-sensitive claims.

## Domain rules

- [javascript.md](javascript.md)
- [node.md](node.md)
- [express.md](express.md)
- [mongodb.md](mongodb.md)
- [postgresql.md](postgresql.md)
- [dsa.md](dsa.md)

## Scope boundary

Existing notes under `Javascript/` are preserved source material and are not canonical instructions. Do not rewrite or reorganize them unless the user explicitly requests that work. Future lecture content belongs wherever the user explicitly directs it; these files only define how that content should be produced and reviewed.