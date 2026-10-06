# Day 7: Feature Flow and Working Fluency

## Feature workflow

1. **Component boundaries:** Group cohesive UI and state ownership; avoid both one giant component and needless fragments.
2. **Data path:** Trace user event → state/action → request → loading/success/error → rendered result.
3. **Accessibility:** Labels, keyboard behavior, focus, and announced status/errors are part of feature correctness.
4. **Backend boundary:** Client checks improve UX; server validation, authentication, and authorization remain authoritative. [Thinking in React](https://react.dev/learn/thinking-in-react) | [React quick start](https://react.dev/learn)

## Tricky points

1. **Feature design**
	1.1 **State owner:** Keep one source of truth and lift state only to the nearest shared owner.
	1.2 **Async response:** Tie results to request identity so stale responses do not overwrite newer input.
	1.3 **List identity:** Stable keys preserve the right row state through reordering/deletion.
2. **Working fluency**
	2.1 **Security:** A hidden button or client route check does not authorize an API operation.
	2.2 **Optimization:** Measure the bottleneck before claiming memoization improves performance.
	2.3 **Scope:** This week targets ordinary feature work and interview terminology, not React internals or specialist optimization.