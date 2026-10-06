# Day 2: Templates, Data Binding, Control Flow, and Pipes

Quick review of Angular template mechanics. Covers the 4 binding types, modern built-in control flow (`@if`, `@for`), two-way binding syntax, and pure/impure pipes.

## Data binding syntax and two-way binding

**1. The four binding mechanisms**

1. *Interpolation (`{{ value }}`):* Evaluates expression and renders text into the DOM.
2. *Property Binding (`[prop]="value"`):* Sets a DOM property or child component input dynamically.
3. *Event Binding (`(event)="handler($event)"`):* Listens for DOM or component events and executes handler.
4. *Two-Way Binding (`[(ngModel)]="value"`):* "Banana in a box" syntax syncing input UI value and class property bidirectionally.

```typescript
@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <!-- Interpolation & Property -->
    <h2 [id]="headingId">{{ title }}</h2>

    <!-- Event Binding -->
    <button (click)="increment()">Click</button>

    <!-- Two-Way Binding -->
    <input [(ngModel)]="username" />
    <p>User: {{ username }}</p>
  `
})
export class BindingDemoComponent {
  headingId = 'title-1';
  title = 'Binding Overview';
  username = '';
  increment() { /* ... */ }
}
```

[Template syntax](https://angular.dev/guide/templates) | [Two-way binding](https://angular.dev/guide/templates/two-way-binding)

## Modern control flow and pipes

**1. Modern built-in control flow (`@if`, `@for`, `@switch`)**

Modern Angular uses `@`-syntax for control flow directly in the template compiler, replacing legacy `*ngIf` and `*ngFor` directives. In `@for`, `track` is mandatory.

```html
<!-- Conditional rendering -->
@if (isLoggedIn) {
  <p>Welcome back, user!</p>
} @else if (isGuest) {
  <p>Welcome, guest!</p>
} @else {
  <button (click)="login()">Log In</button>
}

<!-- List rendering with mandatory tracking -->
<ul>
  @for (user of users; track user.id) {
    <li>{{ user.name }} (Index: {{ $index }})</li>
  } @empty {
    <li>No users found.</li>
  }
</ul>
```

**2. Built-in and custom pipes**

Pipes transform display values directly within template expressions (`value | pipeName:arg`).
- Built-ins: `date:'short'`, `uppercase`, `currency:'USD'`, `json`.
- `async` pipe: Automatically subscribes to an Observable or Promise and unsubscribes upon component destruction.

```html
<p>Total: {{ price | currency:'USD' }}</p>
<p>Updated: {{ lastUpdated | date:'medium' }}</p>
<p>{{ userObservable$ | async | json }}</p>
```

[Control flow](https://angular.dev/guide/templates/control-flow) | [Pipes overview](https://angular.dev/guide/pipes)

## Tricky points

1. **Templates and control flow**
   **1.1 Missing `track` in `@for`:** Modern `@for` requires an explicit `track` expression (e.g. `track item.id` or `track $index`). Omitting `track` causes compile errors, and using index for reorderable collections causes DOM focus bugs.
   **1.2 Two-way binding missing `FormsModule`:** Using `[(ngModel)]` in a standalone component without importing `FormsModule` in the component `imports: [FormsModule]` throws a template parse error.

2. **Pipes and performance**
   **2.1 Expensive function calls in templates:** Calling class methods directly in template interpolation (e.g. `{{ calculateDiscount(price) }}`) runs on *every single change detection cycle*, severely degrading rendering performance. Use a pure pipe or computed signal instead.
   **2.2 Impure pipe overhead:** Custom pipes default to pure (`pure: true`), executing only when input reference changes. Setting `pure: false` runs the pipe on every cycle, risking frame drops.