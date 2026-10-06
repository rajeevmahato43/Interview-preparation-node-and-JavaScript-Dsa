# Day 6: Lifecycle Hooks, Change Detection, and Memory Management

Quick review of component lifecycles, performance optimizations, and memory cleanup in Angular. Covers essential lifecycle hooks, `OnPush` change detection strategy, `DestroyRef`, and `takeUntilDestroyed`.

## Lifecycle hooks and cleanup

**1. Essential component lifecycle hooks**

- `ngOnInit`: Runs once after initial `@Input()` bindings are resolved; optimal place for initialization logic.
- `ngOnChanges(changes: SimpleChanges)`: Runs whenever `@Input()` properties change by reference.
- `ngAfterViewInit`: Runs after component template and child views are fully initialized (DOM elements accessible).
- `ngOnDestroy`: Runs right before Angular destroys the component; clean up timers and manual subscriptions.

```typescript
import { Component, OnInit, OnDestroy, Input, SimpleChanges, OnChanges } from '@angular/core';

@Component({
  standalone: true,
  template: `<p>Status: {{ status }}</p>`
})
export class StatusMonitorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() status!: string;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['status']) console.log('Status changed:', changes['status'].currentValue);
  }

  ngOnInit() {
    console.log('Component initialized');
  }

  ngOnDestroy() {
    console.log('Component being destroyed: clean up resources');
  }
}
```

**2. Modern memory cleanup with `DestroyRef` and `takeUntilDestroyed`**

Instead of creating manual `Subject` unsubscription boilerplate in `ngOnDestroy`, use `takeUntilDestroyed()` within the constructor or injection context.

```typescript
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

@Component({ standalone: true, template: `...` })
export class TimerComponent {
  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed()) // Automatically unsubscribes on component destroy
      .subscribe((val) => console.log('Tick:', val));
  }
}
```

[Component lifecycle](https://angular.dev/guide/components/lifecycle)

## Change detection strategies: Default vs OnPush

**1. `ChangeDetectionStrategy.OnPush`**

By default, Angular runs change detection across the entire component tree on any asynchronous event (via Zone.js). Setting `changeDetection: ChangeDetectionStrategy.OnPush` checks the component only when:
1. An `@Input()` reference changes (`Object.is`).
2. An event originates from within the component or its children.
3. An `async` pipe or Signal in the template emits a new value.
4. `ChangeDetectorRef.markForCheck()` is called explicitly.

```typescript
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-user-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush, // Skips unnecessary subtree checks
  template: `<div>{{ user.name }}</div>`
})
export class UserRowComponent {
  @Input() user!: { id: string; name: string };
}
```

[Change detection](https://angular.dev/guide/components/change-detection) | [Optimizing change detection](https://angular.dev/guide/components/change-detection#optimizing-performance)

## Tricky points

1. **Lifecycle pitfalls**
   **1.1 Accessing `@ViewChild` in `ngOnInit`:** Template DOM elements queried with `@ViewChild` are not yet available in `ngOnInit` (they are `undefined`); access them in `ngAfterViewInit`.
   **1.2 Modifying bindings in `ngAfterViewInit`:** Mutating component properties inside `ngAfterViewInit` causes the dreaded `ExpressionChangedAfterItHasBeenCheckedError` in development mode.

2. **Change detection and memory**
   **2.1 Direct object mutation with OnPush:** Mutating `user.name = "Bob"` without changing the `user` object reference will *not* trigger change detection in an `OnPush` component. Always pass a new reference `{ ...user, name: "Bob" }`.
   **2.2 Zone.js pollution:** Running continuous intervals or WebSocket events inside Angular forces Zone.js to run change detection app-wide on every tick; run external background timers outside Angular via `NgZone.runOutsideAngular()`.