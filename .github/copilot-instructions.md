# Workspace Instructions for LLMs

This repository is a Node.js and JavaScript interview-preparation workspace. These instructions are intentionally written to be portable across LLM systems, not only GitHub Copilot.

This file should be treated as a general repository instruction set for any LLM or coding agent that reads workspace guidance.

## Always follow the repo rules first

- Read the root [AGENTS.md](../AGENTS.md) before making changes that affect teaching, interviews, or study content.
- Follow the shared instruction files in [DOCS/README.md](../DOCS/README.md) and the relevant topic rule files when the task touches JavaScript, Node.js, Express, MongoDB, PostgreSQL, or DSA.
- For [Quick-prep](../Quick-prep/README.md), follow [quick-prep-rules.md](../DOCS/quick-prep-rules.md); its concise seven-day interview format is separate from the full courses.
- Keep content focused on interview prep, backend Node.js work, and deep JavaScript understanding.
- Preserve workspace boundaries: do not rewrite or move the existing source material in [Javascript](../Javascript) unless the user explicitly asks for that work.

## Skill selection policy

Use the most relevant skill for the request. The skill set is repository-local and should work across LLM environments:

- Use [course-builder-master](../.agents/skills/course-builder-master/SKILL.md) when the task is to create a full course, lecture set, curriculum, roadmap, or multi-part learning system.
- Use [world-class-teacher](../.agents/skills/world-class-teacher/SKILL.md) when the task is to create or teach a technical concept clearly and practically.
- Use [lecture-review](../.agents/skills/lecture-review/SKILL.md) when rewriting or improving a lecture file to match the repo's lecture rules.
- Use [interview-prep-architect](../.agents/skills/interview-prep-architect/SKILL.md) when the task is to build a roadmap, study plan, or prep strategy.
- Use [technical-interviewer](../.agents/skills/technical-interviewer/SKILL.md) when the task involves running, designing, or evaluating technical interviews.
- Use [senior-engineering-mentor-coaching](../.agents/skills/senior-engineering-mentor-coaching/SKILL.md) when the task is mentoring engineers on judgment, communication, or leadership.
- Use [code-review-mentor](../.agents/skills/code-review-mentor/SKILL.md) when the task is code review coaching or review quality improvement.
- Use [technical-leadership-coach](../.agents/skills/technical-leadership-coach/SKILL.md) when the task is leadership and decision-making coaching.

## Preferred output style

- Prefer clear, practical teaching over theory-heavy explanation.
- Start with definitions in plain English before adding technical nuance.
- Show both the correct behavior and the common failure case.
- Include code examples, edge cases, and interview-oriented reasoning where relevant.
- Keep lessons readable and concise, but complete.

## Content requirements

- Write original explanations and avoid copying external sources word for word.
- When creating lecture content, use a structured Markdown format with outcomes, prerequisites, summary, cheat sheet, tricky points, and interview questions.
- Exception: Quick-prep lectures use the compact structure in `DOCS/quick-prep-rules.md` and should not be padded with full-course sections.
- Add a real-world or backend-oriented example whenever it improves understanding.
- Make the answer useful for a mid-to-senior engineer preparing for technical interviews.

## File and workflow expectations

- Prefer adding or editing only the files needed for the task.
- Keep Markdown as the default format for teaching and note content.
- Use the skill index at [.agents/skills/README.md](../.agents/skills/README.md) as the quick map for choosing a skill.

## Default behavior

When the task is ambiguous, prefer:
1. the clearest educational explanation,
2. the best interview-ready structure,
3. practical examples and failure modes,
4. concise but complete guidance.

This instruction set should help the agent choose the right skill and stay aligned with the repository's goals.
