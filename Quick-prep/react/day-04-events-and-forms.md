# Day 4: Events, Forms, and User Input

Quick review of React event systems and user inputs. Covers SyntheticEvent normalization, controlled vs uncontrolled inputs, form validation handling, and multi-field form state management.

## Event handling and synthetic events

**1. Event handlers and synthetic event wrapper**

Pass event handler functions directly as props (e.g. `onClick={handleClick}`, not `onClick={handleClick()}`). React wraps native browser events in cross-browser `SyntheticEvent` instances.

```jsx
function Button({ onAction }) {
  const handleClick = (e) => {
    e.stopPropagation(); // Prevents bubbling to parent containers
    onAction();
  };
  return <button onClick={handleClick}>Submit</button>;
}
```

**2. Form submission and preventing default navigation**

HTML forms reload the browser page upon submission by default. Call `e.preventDefault()` inside the `onSubmit` handler to keep routing client-side.

```jsx
function SearchForm({ onSearch }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };
  return <form onSubmit={handleSubmit}>...</form>;
}
```

[Responding to events](https://react.dev/learn/responding-to-events)

## Controlled vs uncontrolled components

**1. Controlled inputs**

Form inputs where React state is the "single source of truth". The `<input>` receives its value from a `value` prop and notifies changes via an `onChange` callback.

```jsx
function ControlledInput() {
  const [text, setText] = useState("");
  return (
    <input
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder="Type here..."
    />
  );
}
```

**2. Uncontrolled inputs (`useRef`)**

Form inputs where the browser DOM retains its own internal value. Access the value imperatively using a `ref` on submit or use `defaultValue` for initial state.

```jsx
function UncontrolledForm({ onSave }) {
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const file = fileInputRef.current.files[0];
    onSave(file);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" ref={fileInputRef} />
      <button type="submit">Upload</button>
    </form>
  );
}
```

**3. Multi-field form handling**

Manage complex form objects by dynamically updating fields using the input's `name` attribute in an immutable state updater.

```jsx
function RegistrationForm() {
  const [formData, setFormData] = useState({ username: "", email: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <input name="username" value={formData.username} onChange={handleChange} />
      <input name="email" value={formData.email} onChange={handleChange} />
    </div>
  );
}
```

[Sharing state between components](https://react.dev/learn/sharing-state-between-components)

## Tricky points

1. **Controlled vs uncontrolled traps**
   **1.1 Switching from uncontrolled to controlled:** Initializing state with `undefined` (`useState()`) makes the input uncontrolled initially. When state updates to a string, React throws a warning: *"A component is changing an uncontrolled input to be controlled"*. Always initialize string inputs with empty string `""`.
   **1.2 Immediate execution on render:** Passing `onClick={handleClick()}` invokes the function immediately during the render pass, instead of waiting for a user click. Always pass a function reference `onClick={handleClick}` or arrow function `onClick={() => handleClick(id)}`.

2. **Forms and events**
   **2.1 Native file inputs cannot be controlled:** File inputs `<input type="file">` are strictly read-only for JavaScript security and must always be handled as uncontrolled components with `useRef`.
   **2.2 Checkbox checked vs value:** Checkboxes use `e.target.checked` (boolean), not `e.target.value`. Reading `value` on a checkbox yields `"on"` regardless of checked status.