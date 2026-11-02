# Interview Rules & Question Standards

Every lecture and study guide must teach the underlying concepts thoroughly before presenting interview questions or practice challenges.

---

## The 45-Second Technical Pitch

When summarizing a core topic or pattern:
- Provide a concise, spoken-style summary of the topic.
- Use simple, Basic Everyday English and clean physical comparisons.
- Explain what it is, what bottleneck it solves, its time/space complexity, and where it is used in real systems.
- Avoid meta-interview filler phrases (e.g. do not write "In technical interviews, you should say..."). Deliver the engineering pitch directly.

---

## Question Sequence & Progression

When interview Q&A or diagnostic questions are presented, use this high-signal 4-part progression:

1. **Core Mental Model Check:** Tests whether the candidate understands the fundamental principle rather than memorized code.
2. **Predict-the-Output or Trace Question:** Tests observable behavior, execution order, pointer movement, or edge-case handling.
3. **Debugging & Failure Analysis:** Presents buggy code and asks to diagnose why it fails and provide the fix.
4. **Senior Backend Trade-Off at Scale:** Connects the concept to high-traffic Node.js systems, memory pressure, database offloading, or event loop blocking.

---

## Formatting Guidelines

- **Clean Numbered Headings:** Headings must be the question itself:
  ```markdown
  ### 1. Why does Binary Search strictly require a sorted array?
  **Answer:**
  [Clear, high-density explanation in simple English...]
  ```
- **NO Difficulty Tags:** Do not use tags like `Hard`, `Very Hard`, `Beginner`, or `Senior`.
- **NO Artificial Subheadings:** Do not insert narrative subheadings like "The Everyday Mental Model" or "Deep Questions & Answers".
- **NO "Expected Answer Shape":** Give the complete, polished answer directly.
- **NO Preachy Meta-Interview Talk:** Deliver the computational, algorithmic, and backend insights directly without preachy meta-interview commentary.

---

## Practice Problems Format

Practice problems appear under the final section (`## 6. Practice Problems`). They must be presented **without code solutions** so the learner can solve them independently, with progressive hints:

```markdown
## 6. Practice Problems

### 6.1 Problem Name - Easy / Warm-Up
[Problem statement, rules, and constraints...]
- **Sample Input 1:** `nums = [2, 7, 11, 15]`, `target = 9`
- **Expected Output 1:** `[0, 1]`
- **Sample Input 2:** `nums = [3, 2, 4]`, `target = 6`
- **Expected Output 2:** `[1, 2]`
- **Hint 1:** [First progressive Socratic hint]
- **Hint 2:** [Second progressive Socratic hint]

### 6.2 Problem Name - Medium
...

### 6.3 Problem Name - Hard / Advanced
...
```

---

## Simple Language Guidelines for Interview Answers

- **Use Basic English:** Write answers in simple words. Explain trade-offs directly without complex jargon.
- **Trade-Off Matrices:** When comparing approaches, use clean Markdown tables comparing:
  - Time Complexity (Best, Average, Worst).
  - Space Complexity (Auxiliary memory).
  - Event loop impact (Node.js main thread blocking).
  - Practical engineering trade-offs (CPU vs. RAM vs. network cost).