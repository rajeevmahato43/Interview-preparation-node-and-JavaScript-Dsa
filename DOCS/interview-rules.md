# Interview Rules & Question Standards

Every lecture and study guide must teach the underlying concepts thoroughly before presenting interview questions. Interview questions belong at the end of each day's lecture.

---

## The 45-Second Technical Pitch

Every interview section should begin with a structured **45-Second Technical Pitch**:
- A concise, spoken-style summary of the topic.
- Uses simple English and clean physical comparisons.
- Explains what it is, what bottleneck it solves, its time/space complexity, and where it is used in real systems.
- Free of filler words or awkward speech.

---

## Question Sequence & Progression

Under `## 11. Interview Q&A`, present exactly 3 to 4 high-signal questions in this progression:

1. **Core Mental Model Check:** Tests whether the candidate understands the fundamental principle rather than memorized code.
2. **Predict-the-Output or Trace Question:** Tests observable behavior, execution order, pointer movement, or edge-case handling.
3. **Debugging & Failure Analysis:** Presents buggy code and asks the candidate to diagnose why it fails and provide the fix.
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

---

## Practice Problems Format

Practice problems appear under `## 12. Practice Problems`. They must be presented **without code solutions** so the learner can solve them independently:

```markdown
## 12. Practice Problems

### 1. Problem Name - Easy
[Problem statement, rules, and constraints...]
- **Sample Input 1:** `nums = [2, 7, 11, 15]`, `target = 9`
- **Expected Output 1:** `[0, 1]`
- **Sample Input 2:** `nums = [3, 2, 4]`, `target = 6`
- **Expected Output 2:** `[1, 2]`

### 2. Problem Name - Medium
...

### 3. Problem Name - Hard
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