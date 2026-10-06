# Day 5: Data Fetching and Navigation

## Server data

1. **Request states:** Model loading, success (including empty), and error; define retry/stale-data behavior.
2. **Request races:** When query/route changes, cancel old work if supported or ignore responses that no longer match current input.
3. **State ownership:** Remote data/cache and ephemeral UI state have different lifetimes; use router/data tooling when cache/revalidation needs grow.
4. **Effects:** Fetching synchronizes with an external system; derived UI values should be calculated during render. [Effects guidance](https://react.dev/learn/escape-hatches)

## Navigation and boundaries

1. **Routing:** A client router maps URL state to views and supports navigation/deep links; exact APIs depend on the router library.
2. **Authorization:** Hiding a route/control is a UX decision; the backend must authorize every data operation.
3. **API integration:** Define behavior for timeouts, unauthorized responses, validation errors, and empty results.

## Tricky points

1. **Async data**
	1.1 **Stale response:** A slower old search response can overwrite the latest query unless guarded or canceled.
	1.2 **Unmount:** A component losing interest does not automatically cancel underlying work; use supported cancellation and cleanup.
	1.3 **Error state:** Empty data is not the same as request failure.
2. **Navigation**
	2.1 **Client guard:** It cannot secure an API against direct requests.
	2.2 **Deep link:** Refreshing a client route requires server/build configuration to serve the application entry point.