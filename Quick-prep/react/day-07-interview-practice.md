# Day 7: Full-Stack Integration, Debugging, and Interview Synthesis

Quick review of end-to-end React workflows. Covers full feature composition, backend contract coordination, React DevTools Profiler debugging, accessibility fundamentals, and senior interview synthesis.

## End-to-end feature architecture and backend contracts

**1. Full feature composition pattern**

A complete, production-ready React component integrates loading states, error boundaries, controlled inputs, and cancellation in a clean architecture:

```jsx
function TaskManager({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState({ loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/projects/${projectId}/tasks`, { signal: controller.signal })
      .then((res) => { if (!res.ok) throw new Error("Load failed"); return res.json(); })
      .then((data) => { setTasks(data); setStatus({ loading: false, error: null }); })
      .catch((err) => {
        if (err.name !== "AbortError") setStatus({ loading: false, error: err.message });
      });
    return () => controller.abort();
  }, [projectId]);

  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    });
    const newTask = await res.json();
    setTasks((prev) => [...prev, newTask]);
    setTitle("");
  };

  if (status.loading) return <p>Loading...</p>;
  if (status.error) return <p>Error: {status.error}</p>;

  return (
    <div>
      <form onSubmit={addTask}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task..." />
        <button type="submit">Add Task</button>
      </form>
      <ul>
        {tasks.map((t) => <li key={t.id}>{t.title}</li>)}
      </ul>
    </div>
  );
}
```

**2. Backend developer contract collaboration**

Backend engineers building APIs for React clients should ensure:
- Predictable error payload schema: `{ error: { code: "RESOURCE_NOT_FOUND", message: "..." } }`.
- Pagination using cursor envelopes: `{ data: [...], nextCursor: "ey...", hasMore: true }`.
- Consistent date formats: ISO-8601 strings (`2026-10-06T12:00:00Z`).

## Debugging, profiling, and accessibility

**1. Profiler and identifying re-renders**

Use React DevTools Profiler to record rendering passes:
- Gray components: Did not re-render.
- Blue/Yellow components: Re-rendered; inspect "Why did this render?" to check changed props or state hooks.

**2. Web Accessibility (a11y) core rules**

Use semantic HTML elements (`<button>`, `<nav>`, `<main>`) rather than `div` with click handlers. Ensure interactive elements are keyboard focusable and have descriptive labels (`aria-label`).

```jsx
// Bad: inaccessible to keyboard and screen readers
<div onClick={handleClose}>X</div>

// Good: accessible native button with accessible label
<button type="button" onClick={handleClose} aria-label="Close dialog">
  &times;
</button>
```

## Tricky points

1. **Full-stack coordination**
   **1.1 Optimistic UI rollback:** Optimistically appending an item to state before server confirmation improves perceived speed, but if the network POST fails, the UI must roll back to the previous snapshot and alert the user.
   **1.2 Client vs Server responsibilities:** Never rely on frontend validation alone; malicious or faulty clients can bypass client form rules and send raw HTTP payloads directly to the Node.js API.

2. **Performance and state**
   **2.1 Deeply nested state updates:** Updating an entity buried 4 levels deep in an object creates complex, error-prone spread boilerplate; normalize state by ID or use a dedicated reducer.
   **2.2 Dev mode double-rendering:** In React 18+ development with `<React.StrictMode>`, components mount, unmount, and remount immediately to uncover uncleaned effects. Do not remove Strict Mode to silence this; fix the missing effect cleanups.