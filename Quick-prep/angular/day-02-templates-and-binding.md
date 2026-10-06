# Day 2: Templates and Binding

## Template syntax

1. **Interpolation:** `{{ value }}` displays dynamic text.
2. **Property and attribute binding:** `[value]="name"` passes a value to a DOM/component property; use attribute binding when the HTML attribute itself is required.
3. **Event and two-way binding:** `(click)="save()"` handles an event; `[(...)]` combines value flow and update event for supported APIs.
4. **Control flow:** Conditional/repetition syntax shows or creates template content; pipes format/transform values for display. [Templates](https://angular.dev/guide/templates) | [Binding](https://angular.dev/guide/templates/binding) | [Events](https://angular.dev/guide/templates/event-listeners) | [Control flow](https://angular.dev/guide/templates/control-flow) | [Pipes](https://angular.dev/guide/templates/pipes)

## Tricky points

1. **Binding**
	1.1 **Property versus attribute:** They are related but distinct DOM concepts; choose the binding that matches the required behavior.
	1.2 **Two-way binding:** It is still a value plus an update event, not global shared state.
2. **Templates**
	2.1 **Expression work:** Costly method calls in templates may run repeatedly during view checking.
	2.2 **Control-flow version:** New built-in syntax and older structural directives may coexist in codebases; follow project version/style.
	2.3 **Security:** Angular templates do not make arbitrary untrusted HTML safe to bypass sanitization.