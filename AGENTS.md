# Node Interview Preparation Workspace Instructions

These instructions apply to every chat and every file change in this workspace.

## Required instruction files

Before answering or changing interview-preparation content, read and follow:

1. [DOCS/README.md](DOCS/README.md)
2. [DOCS/content-rules.md](DOCS/content-rules.md)
3. [DOCS/interview-rules.md](DOCS/interview-rules.md)
4. [DOCS/example-rules.md](DOCS/example-rules.md)
5. [DOCS/accuracy-rules.md](DOCS/accuracy-rules.md)
6. The relevant topic instructions:
	- [DOCS/javascript.md](DOCS/javascript.md)
	- [DOCS/node.md](DOCS/node.md)
	- [DOCS/express.md](DOCS/express.md)
	- [DOCS/mongodb.md](DOCS/mongodb.md)
	- [DOCS/postgresql.md](DOCS/postgresql.md)
	- [DOCS/dsa.md](DOCS/dsa.md)
7. For content under [Quick-prep](Quick-prep/README.md), also follow [DOCS/quick-prep-rules.md](DOCS/quick-prep-rules.md). Its compact format is specific to that track and does not replace shared accuracy or example rules.

If a request spans multiple topics, apply every relevant topic file. Shared rules apply first; topic rules add constraints and may clarify scope but must not contradict them. When instructions conflict, use the more specific rule and preserve the requirements in this file.

## Project purpose

This workspace is for mid-to-senior interview preparation with a backend Node.js emphasis and deep JavaScript coverage. Content should be created as complete, day-wise Markdown lectures that teach the underlying concepts thoroughly before presenting summaries, revision material, and interview questions.

## Repository boundaries

- `DOCS/` is the canonical location for LLM and project-content instructions only. Do not put lectures, roadmaps, question banks, answer keys, or application code there unless explicitly requested.
- Generated course lectures must use Markdown files in a course directory with stable names such as `day-01-topic.md` and `day-02-topic.md`. Keep each course in its own root directory, such as `Javascript/javascript-lectures/` and `Node/node-lectures/`, with its roadmap beside the lecture directory.
- The existing `Javascript/` directory is preserved source material. Do not delete, migrate, rename, or silently rewrite it.
- Keep edits limited to the files required by the user's request. Do not add dependencies, runtime code, or unrelated configuration.
- Use Markdown for new instruction or study-system documentation and use relative links between workspace documents.
- Keep the standalone seven-day interview sprints in `Quick-prep/`; do not merge them into the comprehensive course directories.
- Write original explanations. Summarize external material instead of copying it, and record authoritative references when technical accuracy depends on them.

## Required behavior

Every generated study explanation must follow the applicable rules in `DOCS/`. Every lecture must use clear, basic English for definitions, teach with concrete code examples, define specialized terms in-place with a 1-line callout block or inline clarification (without learning outcomes or vocabulary card tables), provide rich and detailed Summary and Tricky Points sections, and end with an `Interview Questions` section. Add JavaScript, Node.js, and DSA connections when they are useful, not mechanically.

Every new DOCS instruction file must be listed in [DOCS/README.md](DOCS/README.md) and linked from this file. Technical examples must follow [DOCS/example-rules.md](DOCS/example-rules.md), and version-sensitive claims must follow [DOCS/accuracy-rules.md](DOCS/accuracy-rules.md).
