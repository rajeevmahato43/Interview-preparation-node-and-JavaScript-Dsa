# Day 2: State, Immutability, and the Render Lifecycle

Quick review of React state mechanics. Covers `useState` snapshots, automatic batching, functional updater functions, immutable object/array updates, lifting state up, and the trigger-render-commit lifecycle.

## State mechanics and batching

**1. `useState` and state snapshots**

State variables behave like snapshots over time. Calling a state setter does not mutate the variable in the currently executing render; it schedules a re-render with the new value.

```jsx
const [count, setCount] = useState(0);

function handleClick() {
  setCount(count + 1);
  console.log(count); // Still logs 0 in current render execution
}
```

**2. Functional state updaters**

When the new state depends on the previous state and multiple updates occur within the same event handler, pass an updater function `prev => prev + 1` to read from the pending state queue.

```jsx
// Bad: both read the same snapshot; count increments by 1
setCount(count + 1);
setCount(count + 1);

// Good: reads latest pending state; count increments by 2
setCount((prev) => prev + 1);
setCount((prev) => prev + 1);
```

**3. Automatic batching**

React batches state updates triggered within event handlers, `setTimeout`, promises, and native event listeners into a single re-render to avoid unnecessary UI redraws.

[State: A component's memory](https://react.dev/learn/state-a-components-memory) | [State as a snapshot](https://react.dev/learn/state-as-a-snapshot) | [Queueing state updates](https://react.dev/learn/queueing-a-series-of-state-updates)

## Immutability and the render lifecycle

**1. Updating object and array state**

Never mutate objects or arrays directly in state. Always create a new copy using spread syntax (`...`) or non-mutating array methods (`map`, `filter`).

```jsx
// Bad: direct mutation; React fails to detect reference change
user.age = 30;
setUser(user);

// Good: create new object copy
setUser({ ...user, age: 30 });

// Array update: append and filter
setItems([...items, newItem]);
setItems(items.filter((item) => item.id !== removeId));
```

**2. Lifting state up**

When two sibling components must coordinate state, lift the shared state up to their closest common parent and pass down values and updater callbacks via props.

```jsx
function Parent() {
  const [filter, setFilter] = useState("");
  return (
    <>
      <SearchInput value={filter} onChange={setFilter} />
      <ResultsList filter={filter} />
    </>
  );
}
```

**3. The render lifecycle: Trigger, Render, Commit**

1. *Trigger:* Initial mount or state change schedules a render.
2. *Render:* React calls the component function to generate the new Virtual DOM tree and diffs it with the previous tree. Components must be pure functions with no side effects.
3. *Commit:* React mutates the real browser DOM only for elements that changed.

[Updating objects in state](https://react.dev/learn/updating-objects-in-state) | [Updating arrays in state](https://react.dev/learn/updating-arrays-in-state) | [Render and commit](https://react.dev/learn/render-and-commit)

## Tricky points

1. **State snapshots and updates**
   **1.1 Stale closure in event handlers:** Reading a state variable after an `await` in an async handler reads the state snapshot captured when the function was invoked, not newer state from subsequent renders.
   **1.2 Mutation bypasses re-render:** Calling `arr.push(item); setArr(arr);` passes the exact same object reference (`Object.is(prev, next)` is true); React skips the render entirely.

2. **Render purity**
   **2.1 Side effects during render:** Calling `fetch()`, writing to `localStorage`, or mutating external variables directly in the component function body causes duplicate network calls and UI bugs under React Strict Mode (which renders twice in development).
   **2.2 Unnecessary state redundancy:** If a value can be computed directly from existing props or state during render (e.g. `fullName = first + " " + last`), do not duplicate it into separate state variables.