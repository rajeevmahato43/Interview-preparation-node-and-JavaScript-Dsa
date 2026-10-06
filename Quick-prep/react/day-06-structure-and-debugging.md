# Day 6: Context, Performance, and Errors

## App state and structure

1. **Lift state:** Put shared state in the closest common parent and pass values/callbacks down.
2. **Context:** Provides subtree-wide values when prop passing is cumbersome; it is not automatically a global state solution.
3. **Reducer:** Centralizes related transitions as actions when updates become complex; use with context only when it helps. [Managing state](https://react.dev/learn/managing-state)

## Rendering and debugging

1. **Render causes:** State, parent rendering, and context changes can rerun components; React reconciles descriptions before DOM commit.
2. **Identity and keys:** Stable keys help preserve local state for the correct item across list changes.
3. **Performance:** Profile before `memo`, `useMemo`, or `useCallback`; these optimize recomputation/identity, not correctness.
4. **Error boundaries:** Handle supported render-tree failures; event-handler and request errors need explicit handling. [DevTools](https://react.dev/learn/react-developer-tools) | [Pure components](https://react.dev/learn/keeping-components-pure)

## Tricky points

1. **State sharing**
	1.1 **Context scope:** Consumers update when the provided value changes; choose provider boundaries deliberately.
	1.2 **Duplicate state:** Mirroring props or derived values creates synchronization bugs; derive when possible.
2. **Performance**
	2.1 **Memoization:** It does not prevent every render and can add complexity; measure first.
	2.2 **Keys:** Index keys can move local state to a different row after sorting/reorder.
3. **Errors**
	3.1 **Boundary scope:** Error boundaries do not catch every event-handler/async failure; handle those at their call sites.