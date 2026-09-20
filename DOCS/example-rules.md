# Example Rules

Examples exist to make behavior testable and understandable, not to decorate an explanation. Important concepts require at least one example. Difficult concepts require a multi-step example, trace, comparison, or failure case when that makes the behavior easier to understand.

## Code examples

- Use JavaScript for JavaScript, Node.js, Express, and DSA examples unless another language is requested.
- State whether an example is browser code, Node.js code, Express application code, or pseudocode.
- Prefer small complete snippets. Include imports, setup, and required async handling when omitting them would mislead the learner.
- Mark intentionally incomplete code and explain what remains to be implemented.
- Use descriptive names and avoid unexplained one-letter variables outside conventional indices.
- Show expected output or observable behavior for non-obvious examples.
- Use a short example for familiar basics and spend more detail on examples involving ordering, state changes, errors, concurrency, performance, or edge cases.

## Database examples

- Label MongoDB shell, MongoDB driver, Mongoose, SQL, `psql`, or Node.js client examples precisely.
- Include schema assumptions, relevant constraints, indexes, and transaction boundaries when they affect the result.
- Never place real credentials, tokens, personal data, or production connection strings in examples. Use obvious placeholders and environment variables.

## Exercises

Exercises must state the goal, inputs and outputs, constraints, edge cases, and an acceptance criterion. Prefer hints before full solutions when the user requests practice. Keep solutions separate when the project structure calls for lecture-first learning. DSA exercises must also state the expected complexity target when one exists.

## Verification

Do not claim that code was executed unless it was actually run. If execution is unavailable, provide a manual trace or a focused test plan instead.