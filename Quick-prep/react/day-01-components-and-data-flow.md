# Day 1: Components, JSX, and Props

Quick review of foundational React UI building blocks. Covers functional components, JSX syntax constraints, unidirectional prop flow, conditional rendering patterns, and list reconciliation keys.

## Components, JSX, and composition

**1. Functional components and capitalization**

React components are JavaScript functions that return JSX describing UI. Component names must start with an uppercase letter; lowercase names are treated as native HTML tags.

```jsx
// Correct: uppercase identifier denotes React component
function UserBadge({ name }) {
  return <div className="badge">{name}</div>;
}
```

**2. JSX syntax rules and fragments**

JSX compiles to `React.createElement` (or new JSX runtime transforms). Every component must return a single root element; use Fragments (`<>...</>`) to group siblings without creating extra DOM wrapper nodes.

```jsx
function Header() {
  return (
    <>
      <h1>Dashboard</h1>
      <p>Overview of system metrics</p>
    </>
  );
}
```

**3. Props, destructuring, and composition**

Props pass data downward from parent to child (unidirectional data flow). Props are immutable and read-only to the child. Use `children` for container composition.

```jsx
function Card({ title, children }) {
  return (
    <section className="card">
      <h3>{title}</h3>
      <div className="card-body">{children}</div>
    </section>
  );
}
```

[Describing the UI](https://react.dev/learn/describing-the-ui) | [Passing props to a component](https://react.dev/learn/passing-props-to-a-component)

## Conditional rendering, lists, and keys

**1. Conditional rendering patterns**

Use ternary operators (`condition ? <A/> : <B/>`) or early returns for conditional views. Avoid `&&` when the left operand is a number (e.g. `count && <List/>`), which renders `0` into the DOM.

```jsx
// Bad: renders "0" when items.length === 0
{items.length && <ItemList items={items} />}

// Good: explicit boolean check
{items.length > 0 ? <ItemList items={items} /> : <p>No items found</p>}
```

**2. List rendering and key reconciliation**

Render lists using `.map()`. Each item must have a unique, stable `key` prop so React can identify which items changed, moved, or were deleted during reconciliation.

```jsx
function UserList({ users }) {
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

[Conditional rendering](https://react.dev/learn/conditional-rendering) | [Rendering lists](https://react.dev/learn/rendering-lists)

## Tricky points

1. **JSX and components**
   **1.1 Nested component definitions:** Defining a component inside another component's body recreates the function reference on every render, resetting all child state and DOM focus. Always declare components at the top level.
   **1.2 Prop mutation:** Attempting to mutate `props.user.name = "Jane"` bypasses React's change detection and causes inconsistent state across the tree; treat props as read-only snapshots.

2. **Lists and conditions**
   **2.1 Index keys trap:** Using array index as `key` (`key={index}`) corrupts form state and focus when list items are reordered, inserted, or filtered; always use stable database IDs.
   **2.2 Falsy numbers in JSX:** In `{count && <Component />}`, if `count` evaluates to `0`, JavaScript evaluates the expression to `0`, causing React to render the text `"0"` into the UI. Use `{count > 0 && ...}`.