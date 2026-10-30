# Express Domain Instructions

Teach Express as an HTTP application framework whose behavior comes from routing, middleware execution order, request lifecycle, and error propagation.

Follow the shared rules in [content-rules.md](content-rules.md), [example-rules.md](example-rules.md), and [interview-rules.md](interview-rules.md).

---

## Foundational Philosophy

> **"Never teach an Express middleware or route handler without first tracing the physical path of the HTTP request and response step-by-step through the middleware pipeline."**

---

## Required Scope

Cover application setup, route matching, middleware execution order, request and response lifecycle, route parameters, input validation, async error propagation, error-handling middleware (`(err, req, res, next)`), authentication boundaries, payload limits, CORS, rate limiting, and graceful shutdown.

---

## Teaching Standards

1. **Basic English Definitions:** Explain every concept in simple words. Define what it is, what it does, and what it does NOT do before using technical jargon.
2. **In-Place Term Callouts:** Define terms like `Idempotency`, `Middleware Pipeline`, and `CORS` right where they appear.
3. **Trace Execution Steps:** Trace requests through each middleware function with ASCII pipeline diagrams.
4. **Dual-Case Implementations:** Always show `✅ CORRECT / POSITIVE CASE` (e.g., catching async errors properly or using Express 5 native async support) alongside `❌ ANTI-PATTERN / COMMON BUG` (e.g., unhandled promise rejections that hang the HTTP connection) with inline explanations.
5. **No Artificial Line Count Limits:** Never constrain lectures to arbitrary line counts. Lectures can be as long and comprehensive as necessary to deliver exhaustive, world-class depth, line-by-line pipeline derivations, and complete clarity without superficial summaries or forced truncation.
6. **Topic-Appropriate Architecture:** Structure each lecture according to its core discipline (middleware pipelines, error handling, route matching) rather than a rigid, robotic template.
7. **Short, Clean Headings:** Headings must be short, direct, and clean with zero fluff (e.g., `## 1. What is Middleware`, `### 1.1 Execution Order`). Never use long, descriptive subtitles, colons, or parenthetical explanations in headings.
8. **No Preachy Meta-Interview Talk:** Deliver the HTTP processing, security boundaries, and architecture insights directly without preachy meta-interview commentary.