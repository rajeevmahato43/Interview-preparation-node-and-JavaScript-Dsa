# Day 5: Asynchronous Data, Race Conditions, and Navigation

Quick review of asynchronous client-side operations. Covers API fetching patterns, race condition handling with `AbortController`, client-side routing concepts, and backend integration boundaries.

## Asynchronous data fetching and race condition mitigation

**1. Async fetching lifecycle: Loading, Error, Success**

Represent data fetching states explicitly in component state to provide responsive feedback to users.

```jsx
function UserProfile({ userId }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError(null);

    fetch(`/api/users/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((user) => {
        if (!ignore) { setData(user); setIsLoading(false); }
      })
      .catch((err) => {
        if (!ignore) { setError(err.message); setIsLoading(false); }
      });

    return () => { ignore = true; }; // Prevent race condition / stale updates
  }, [userId]);

  if (isLoading) return <div>Loading user...</div>;
  if (error) return <div>Error: {error}</div>;
  return <div>Welcome, {data.name}!</div>;
}
```

**2. Network cancellation with `AbortController`**

Pass an `AbortSignal` to `fetch()` and trigger `.abort()` during the `useEffect` cleanup function. This cancels the pending HTTP network request immediately when the component unmounts or dependencies change.

```jsx
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/items?search=${query}`, { signal: controller.signal })
    .then((res) => res.json())
    .then(setResults)
    .catch((err) => {
      if (err.name !== "AbortError") console.error(err);
    });

  return () => controller.abort();
}, [query]);
```

[Fetching data with Effects](https://react.dev/learn/synchronizing-with-effects#fetching-data)

## Routing and backend integration

**1. Client-side routing concepts**

Client-side routers (e.g. React Router) intercept browser link clicks, update the browser URL using the HTML5 History API (`pushState`), and render the matching component tree without a full-page server reload.

```jsx
// Conceptual Client Router Structure:
<BrowserRouter>
  <nav>
    <Link to="/dashboard">Dashboard</Link>
    <Link to="/profile">Profile</Link>
  </nav>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/profile/:id" element={<Profile />} />
  </Routes>
</BrowserRouter>
```

**2. Backend boundary: CORS and authorization headers**

Frontend React code cannot securely store private API secrets. Attach JSON Web Tokens via standard HTTP headers and handle CORS preflight `OPTIONS` on the backend.

```js
// Authenticated API request
fetch("/api/protected", {
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  }
});
```

## Tricky points

1. **Async and race conditions**
   **1.1 Network race condition:** If a user clicks User 1 then quickly clicks User 2, and the request for User 1 takes longer to return than User 2, the User 1 response will arrive last and overwrite User 2's data. Always use an `ignore` flag or `AbortController`.
   **1.2 Setting state on unmounted components:** In older React versions, setting state after a component unmount threw warnings; in modern React, uncancelled async operations waste bandwidth and trigger memory leaks.

2. **Backend integration**
   **2.1 Missing `res.ok` check:** Native `fetch()` does *not* reject its promise on HTTP 404 or 500 error status codes; it only rejects on complete network failure. Always verify `if (!res.ok) throw new Error(...)`.
   **2.2 Security boundary:** Client-side route guards (e.g. `<PrivateRoute>`) provide UI UX navigation protection only; real data security and authorization must be verified on every backend API endpoint.