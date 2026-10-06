# Day 4: Events and Forms

## User interaction

1. **Event handlers:** Pass a function such as `onClick={handleClick}`; calling it during render executes immediately.
2. **Controlled input:** React state supplies `value`/`checked`, and an event handler updates it; this supports validation and conditional UI.
3. **Uncontrolled input:** The DOM owns the current value; a ref can read it when continuous React state is not needed.
4. **Shared form state:** Put coordinated values in one owner and pass values/callbacks to child fields. [Events](https://react.dev/learn/responding-to-events) | [Shared state](https://react.dev/learn/sharing-state-between-components)

## Tricky points

1. **Controlled inputs**
	1.1 **Value type:** A text input should consistently receive a string; switching from `undefined` to a string changes controlled mode.
	1.2 **Update path:** A controlled input without an `onChange` handler appears read-only.
2. **Validation and async behavior**
	2.1 **Security:** Client validation improves UX; the backend must validate and authorize independently.
	2.2 **Remote validation:** Debounce when useful and ignore/cancel stale requests so old responses do not replace current results.
	2.3 **Events:** Pass the callback reference; `onClick={handleClick()}` executes during render.