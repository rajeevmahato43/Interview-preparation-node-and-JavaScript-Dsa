# Workspace Instruction Set for Any LLM

This repository is a Node.js and JavaScript interview-preparation workspace. The instructions here are intentionally written to be portable across LLM systems, not only GitHub Copilot.

## Primary rules

- Follow the repo-level guidance in [AGENTS.md](AGENTS.md) before making changes.
- Apply the shared standards in [DOCS/README.md](DOCS/README.md) and the relevant topic files under [DOCS](DOCS) when working on JavaScript, Node.js, Express, MongoDB, PostgreSQL, or DSA content.
- For the independent one-week courses in [Quick-prep](Quick-prep/README.md), apply [DOCS/quick-prep-rules.md](DOCS/quick-prep-rules.md); keep their format compact and separate from the comprehensive courses.
- Keep the work focused on backend Node.js interview prep, JavaScript mastery, and practical engineering reasoning.
- Preserve repo boundaries and do not rewrite the existing source material in [Javascript](Javascript) unless the user explicitly requests that work.

## Content expectations

- Explain concepts in simple, direct language before adding nuance.
- Define the concept first, then cover behavior, edge cases, and failure modes.
- Show working and broken code examples where relevant.
- Prefer practical examples tied to backend engineering and interview scenarios.
- End learning content with summary, cheat sheet, tricky points, and interview questions when appropriate.
- Quick-prep lessons use their own short interview-first format; do not expand them into the full-course template.

## Skill routing

Use the best matching skill from [.agents/skills](.agents/skills):

- [world-class-teacher](.agents/skills/world-class-teacher/SKILL.md)
- [lecture-review](.agents/skills/lecture-review/SKILL.md)
- [course-builder-master](.agents/skills/course-builder-master/SKILL.md)
- [interview-prep-architect](.agents/skills/interview-prep-architect/SKILL.md)
- [technical-interviewer](.agents/skills/technical-interviewer/SKILL.md)
- [senior-engineering-mentor-coaching](.agents/skills/senior-engineering-mentor-coaching/SKILL.md)
- [code-review-mentor](.agents/skills/code-review-mentor/SKILL.md)
- [technical-leadership-coach](.agents/skills/technical-leadership-coach/SKILL.md)

## Output style

- Prefer clear teaching over theory-heavy prose.
- Start with plain definitions before jargon.
- Use examples and failure cases to teach the pattern.
- Keep outputs concise, complete, and interview-ready.

## Default behavior

When the task is ambiguous:
1. explain the concept clearly,
2. structure the answer well,
3. include the common failure mode,
4. make it practical and interview-ready.

This instruction set is intentionally portable so it can be used by Copilot, other LLM agents, or any other tooling that reads repo-level guidance.
