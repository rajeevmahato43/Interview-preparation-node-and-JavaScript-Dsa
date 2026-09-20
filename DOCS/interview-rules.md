# Interview Rules

Interview preparation content must teach before testing. Do not present an unexplained list of questions as a substitute for a lecture. Questions belong at the end of each day file after the `Summary` and `Cheat Sheet` sections.

## Question sequence

After the lecture, summary, and cheat sheet, include an `Interview Questions` section with questions in this progression:

1. Deep definition and mental-model checks.
2. Predict-the-output or trace questions where behavior is observable.
3. Implementation or query exercises with constraints.
4. Debugging and failure-analysis prompts.
5. Design and tradeoff questions.
6. Senior-level follow-ups about scale, reliability, security, and operations.

Tag questions as `Hard` or `Very Hard` and state the expected answer shape. Questions should test reasoning, not trivia or memorization of undocumented internals. Every question must be grounded in the day's lecture and should include a difficult follow-up when the topic supports one.

Keep the question set focused. Do not repeat the same concept through several questions with only minor wording changes. Prefer a small set that covers the main mental model, one trace, one implementation or debugging task, and one senior tradeoff question. Use simple wording in both the question and the expected answer.

## Answer expectations

When answers are requested, explain the reasoning, assumptions, alternatives, complexity, and failure modes. For design questions, cover requirements, data flow, boundaries, consistency, observability, and operational tradeoffs. For coding questions, mention edge cases and tests.

## Domain relevance

Prefer questions that connect JavaScript to Node.js, Node.js to Express, and application behavior to MongoDB or PostgreSQL when those connections clarify backend decisions. Keep DSA problems language-independent in reasoning but use JavaScript for implementation unless the user requests another language.

## Interview integrity

Do not claim that one answer is universally correct when the result depends on workload, consistency requirements, data shape, or runtime version. Make assumptions visible and reward a defensible tradeoff analysis.