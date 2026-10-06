# Day 1: Components and Application Structure

Quick review of foundational Angular architecture. Covers `@Component` metadata, standalone components vs NgModules, project layout, CLI conventions, and `@Input` / `@Output` parent-child communication.

## Components and project architecture

**1. Component structure and `@Component` decorator**

An Angular component is a TypeScript class annotated with `@Component` containing template HTML, styles, and selector metadata.

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-user-card',
  standalone: true,
  template: `
    <div class="user-card">
      <h3>{{ username }}</h3>
    </div>
  `,
  styles: [`.user-card { padding: 1rem; border: 1px solid #ccc; }`]
})
export class UserCardComponent {
  username = 'Alice';
}
```

**2. Standalone components vs NgModules**

Modern Angular (v17+) defaults to **standalone components** (`standalone: true`). Standalone components declare their own dependencies directly in their `imports` array, removing the need for `NgModule` declarations.

```typescript
// Standalone Component importing CommonModule or child components directly:
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [UserCardComponent],
  template: `<app-user-card />`
})
export class DashboardComponent {}
```

**3. Angular project directory structure**

- `src/main.ts`: Application bootstrap entrypoint (`bootstrapApplication(AppComponent, appConfig)`).
- `src/app/app.config.ts`: Global providers (routing, HTTP client, animations).
- `src/app/`: Feature components, services, and routes.
- `angular.json`: CLI build, serve, and asset configuration.

[Component overview](https://angular.dev/guide/components) | [Standalone components](https://angular.dev/guide/components/importing)

## Component communication

**1. `@Input()` properties**

Pass data down from parent to child. The parent binds to the property using square brackets `[childProp]="parentValue"`.

```typescript
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-metric',
  standalone: true,
  template: `<p>{{ label }}: {{ value }}</p>`
})
export class MetricComponent {
  @Input({ required: true }) label!: string;
  @Input() value: number = 0;
}
```

**2. `@Output()` and EventEmitter**

Emit custom events upward from child to parent. The parent listens using parentheses `(childEvent)="handleEvent($event)"`.

```typescript
import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-action-button',
  standalone: true,
  template: `<button (click)="notify()">Run</button>`
})
export class ActionButtonComponent {
  @Output() actionTriggered = new EventEmitter<string>();

  notify() {
    this.actionTriggered.emit('Action Completed');
  }
}
```

[Inputs and Outputs](https://angular.dev/guide/components/inputs)

## Tricky points

1. **Standalone and module imports**
   **1.1 Unimported template elements:** In a standalone component, omitting a directive or child component from the `imports: [...]` array causes Angular compiler errors (`'app-metric' is not a known element`).
   **1.2 Legacy NgModule mixing:** When importing an NgModule into a standalone component or vice versa, remember that standalone components cannot be listed in an NgModule's `declarations`; list them in `imports` instead.

2. **Component communication**
   **2.1 Missing `@Input()` required constraint:** Forgetting `{ required: true }` or not initializing with default values can cause runtime `undefined` property access errors in strict TypeScript templates.
   **2.2 Event naming collisions:** Avoid naming an `@Output()` the same as native DOM events (e.g. `@Output() click`), which triggers conflicting event propagation behaviors.