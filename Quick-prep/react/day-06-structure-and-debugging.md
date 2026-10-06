# Day 6: State Architecture, Performance, and Error Handling

Quick review of advanced component patterns. Covers `useContext` for deep state sharing, `useReducer` for predictable state machines, memoization (`memo`, `useMemo`, `useCallback`), and Error Boundaries.

## Context and complex state management

**1. `useContext` to solve prop drilling**

Context allows a parent component to supply data to the entire subtree below it without explicitly passing props through intermediary components.

```jsx
const ThemeContext = createContext("light");

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <MainLayout />
    </ThemeContext.Provider>
  );
}

function ThemedButton() {
  const theme = useContext(ThemeContext);
  return <button className={`btn-${theme}`}>Action</button>;
}
```

**2. `useReducer` for state machines and action dispatching**

Consolidate complex state logic where actions transition states deterministically. The reducer must be a pure function `(state, action) => newState`.

```jsx
function reducer(state, action) {
  switch (action.type) {
    case "increment": return { count: state.count + 1 };
    case "decrement": return { count: state.count - 1 };
    case "reset": return { count: 0 };
    default: throw new Error(`Unknown action: ${action.type}`);
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return (
    <>
      <span>Count: {state.count}</span>
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
    </>
  );
}
```

[Passing data deeply with Context](https://react.dev/learn/passing-data-deeply-with-context) | [Extracting state logic into a reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)

## Performance optimization and error boundaries

**1. Memoization: `React.memo`, `useMemo`, and `useCallback`**

- *`React.memo`:* Skips re-rendering a child component if its props have not changed (`Object.is` shallow check).
- *`useMemo`:* Caches the result of an expensive calculation between renders until dependencies change.
- *`useCallback`:* Caches a function definition between renders to provide a stable reference to memoized child components.

```jsx
// Stable callback prevents re-rendering memoized child
const handleDelete = useCallback((id) => {
  setItems((prev) => prev.filter((item) => item.id !== id));
}, []);

// Caching expensive calculation
const filteredItems = useMemo(() => {
  return items.filter((item) => item.score > threshold);
}, [items, threshold]);
```

**2. Error Boundaries**

Catch JavaScript errors anywhere in the child component tree, log errors, and display a fallback UI instead of crashing the whole application. Error boundaries must be class components defining `static getDerivedStateFromError` or `componentDidCatch`.

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("UI crash caught:", error, info);
  }
  render() {
    if (this.state.hasError) return <h2>Something went wrong.</h2>;
    return this.props.children;
  }
}
```

[Catching rendering errors with an error boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)

## Tricky points

1. **Context and re-rendering**
   **1.1 Context re-render fan-out:** Whenever a Context Provider's `value` changes, *all* consumer components calling `useContext` re-render, even if they only read an unaffected property of a large context object. Split unrelated context into separate providers.
   **1.2 Non-memoized context value:** Passing `<Context.Provider value={{ user, theme }}>` creates a brand new object on every render, invalidating consumer memoization. Wrap the value in `useMemo`.

2. **Memoization pitfalls**
   **2.1 Premature memoization overhead:** Wrapping every trivial function or calculation in `useCallback` / `useMemo` adds memory and comparison overhead that can exceed the cost of the raw function.
   **2.2 Missing Error Boundary coverage:** Error boundaries do *not* catch errors inside event handlers (`onClick`), asynchronous code (`setTimeout`, promises), or server-side rendering; handle those with standard `try/catch`.