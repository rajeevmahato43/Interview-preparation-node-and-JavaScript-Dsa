# Day 1: Components and JSX

## UI building blocks

1. **Components:** JavaScript functions that return UI descriptions; compose small components into pages rather than building one giant component.
2. **JSX:** Markup-like syntax inside JavaScript; close tags, use one parent/fragment, `className`, and braces for expressions.
3. **Props and children:** Inputs flow from parent to child; props are read-only, and `children` supports composition.
4. **Conditional UI and lists:** Use JavaScript conditions and `map`; give each sibling item a stable key from its data identity. [React UI](https://react.dev/learn/describing-the-ui) | [Quick start](https://react.dev/learn)

## Tricky points

1. **Components and rendering**
	1.1 **Capitalization:** Component names start uppercase; lowercase JSX names are treated as built-in elements.
	1.2 **Purity:** Rendering should describe UI, not mutate external state or perform requests.
2. **Props and lists**
	2.1 **Props:** A child requests a parent-owned change through a callback; it should not mutate props.
	2.2 **Keys:** Index keys can attach state to the wrong item after reorder; use stable IDs when available.
	2.3 **Conditional `&&`:** A left operand of `0` can render `0`; use a boolean condition when the result should be only UI or nothing.