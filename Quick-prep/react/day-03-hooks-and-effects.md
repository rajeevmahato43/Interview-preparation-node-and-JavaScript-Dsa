# Day 3: Hooks, Refs, Effects, and Custom Hooks

Quick review of React hooks. Covers the Rules of Hooks, `useEffect` synchronization, cleanup lifecycles, `useRef` for DOM and mutable storage, and custom hook encapsulation.

## Rules of Hooks, useEffect, and cleanup

**1. The Rules of Hooks**

1. Only call hooks at the **top level** of functional components or custom hooks. Never call hooks inside loops, conditions, or nested functions. React relies on consistent call order between renders.
2. Only call hooks from React function components or custom hooks (`use...`).

**2. `useEffect` synchronization and dependency arrays**

Effects synchronize components with external systems (timers, network, browser APIs). The dependency array dictates execution timing:
- *No dependency array:* Runs after every render.
- *Empty array (`[]`):* Runs once after initial mount.
- *Specified dependencies (`[id, query]`):* Runs after mount and whenever any dependency value changes via `Object.is`.

```jsx
useEffect(() => {
  const connection = createConnection(roomId);
  connection.connect();
  return () => connection.disconnect(); // Cleanup function
}, [roomId]);
```

**3. Effect cleanup lifecycle**

When an effect returns a cleanup function, React executes cleanup before re-running the effect with new dependencies, and when the component unmounts. Always clean up intervals, subscriptions, and event listeners.

```jsx
useEffect(() => {
  const handleResize = () => setWidth(window.innerWidth);
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
```

[Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks) | [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects) | [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)

## Refs and custom hooks

**1. `useRef` for DOM access and non-rendering mutable state**

`useRef(initialValue)` returns `{ current: initialValue }`. Mutating `.current` does **not** trigger a component re-render. Use for holding timers, previous values, or references to real DOM elements.

```jsx
function TextInputWithFocus() {
  const inputEl = useRef(null);
  const clickCount = useRef(0); // mutable value without re-render

  const focusInput = () => {
    inputEl.current.focus();
    clickCount.current += 1;
  };

  return (
    <>
      <input ref={inputEl} type="text" />
      <button onClick={focusInput}>Focus</button>
    </>
  );
}
```

**2. Custom hooks**

Custom hooks are JavaScript functions whose names start with `use` that compose built-in hooks to share stateful logic across components without duplicating effect subscriptions.

```jsx
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
```

[Referencing values with refs](https://react.dev/learn/referencing-values-with-refs) | [Manipulating the DOM with refs](https://react.dev/learn/manipulating-the-dom-with-refs) | [Reusing logic with custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

## Tricky points

1. **Effects and dependencies**
   **1.1 Infinite effect render loops:** Updating state inside `useEffect` without specifying dependencies, or including an object created during render in dependencies, triggers an endless loop of render $\rightarrow$ effect $\rightarrow$ set state $\rightarrow$ render.
   **1.2 Stale closures in intervals:** In `setInterval(() => setCount(count + 1), 1000)` with `[]` dependency, `count` remains locked at initial state `0`. Use functional state updates: `setCount(c => c + 1)`.
   **1.3 Overusing Effects for data transformation:** Transforming props or filtering data should happen directly in the render function body; using `useEffect` + `setState` introduces an unnecessary extra render pass.

2. **Refs**
   **2.1 Reading refs during render:** Avoid reading or writing `ref.current` during the main component rendering body; doing so makes component output non-deterministic. Read and write refs only inside event handlers or `useEffect`.