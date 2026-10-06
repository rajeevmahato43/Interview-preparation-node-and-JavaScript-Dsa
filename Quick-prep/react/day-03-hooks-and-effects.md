# Day 3: Hooks and Effects

## Hooks

1. **`useState`:** Adds component memory and returns the current render's value plus a setter.
2. **`useRef`:** Keeps a value or DOM reference across renders without causing a render when `.current` changes.
3. **Custom hooks:** Functions starting with `use` share reusable stateful logic; separate calls have separate hook state unless external state is shared. [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks) | [Refs and Effects](https://react.dev/learn/escape-hatches)

## Effects

1. **Purpose:** `useEffect` synchronizes with an external system such as a subscription, timer, or imperative widget; derived UI values usually need no Effect.
2. **Dependencies:** List reactive values read by the effect; a change causes cleanup and re-synchronization.
3. **Cleanup:** Return a function to disconnect, unsubscribe, or cancel owned work before replacement or unmount.
4. **Reuse:** A custom hook can package setup/cleanup logic so components do not duplicate it. [Effects](https://react.dev/learn/synchronizing-with-effects) | [Avoiding unnecessary Effects](https://react.dev/learn/you-might-not-need-an-effect)

## Tricky points

1. **Hook rules**
	1.1 **Call order:** Call hooks at the top level of components/custom hooks, not inside conditions or loops.
	1.2 **Refs:** Changing `ref.current` does not trigger a render; do not use refs for visible state.
2. **Effects**
	2.1 **Stale closure:** Missing a reactive dependency leaves an old value captured; restructure logic instead of hiding the dependency.
	2.2 **Unnecessary Effect:** Derived state in an Effect adds a render and can drift out of sync.
	2.3 **Strict Mode:** Development may exercise setup/cleanup more than once to expose missing cleanup; make synchronization restartable.