# Day 2: State and Rendering

## State updates

1. **State snapshot:** Each render sees its own state values; a setter schedules a future render rather than changing the current handler's variables.
2. **Updater function:** When next state depends on previous state, `setCount(count => count + 1)` composes queued updates safely.
3. **Render and commit:** React calculates a UI description, then commits needed DOM changes; rendering does not imply every node is replaced.
4. **State shape:** Avoid duplicate/derivable state; lift shared state to the nearest common parent and use a reducer for complex related transitions. [Adding interactivity](https://react.dev/learn/adding-interactivity) | [Managing state](https://react.dev/learn/managing-state)

## Tricky points

1. **Updates**
	1.1 **Snapshots:** Three `setCount(count + 1)` calls can all use the same old count; functional updaters compose.
	1.2 **Mutation:** Mutating an object/array in state can corrupt previous render data; create a new value.
2. **State ownership**
	2.1 **Derived values:** Calculate derived data during render instead of syncing duplicate state with an Effect.
	2.2 **Keys:** Changing a component key creates a new identity and resets local state; stable keys preserve it across list changes.