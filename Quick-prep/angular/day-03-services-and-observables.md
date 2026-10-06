# Day 3: Services, Dependency Injection, Signals, and RxJS

Quick review of Angular business logic architecture. Covers `@Injectable` service scopes, modern `inject()` syntax, Angular Signals (`signal`, `computed`, `effect`), and essential RxJS Observable patterns for backend integration.

## Services, Dependency Injection, and inject()

**1. `@Injectable()` and singleton scope**

Services encapsulate business logic, API calls, and shared application state. Use `providedIn: 'root'` to register a single shared singleton instance across the entire application.

```typescript
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUser: string | null = 'DevUser';
  getUser() { return this.currentUser; }
}
```

**2. Modern `inject()` function vs constructor injection**

Angular allows injecting services using the functional `inject()` API within an injection context (property initializers, constructor), providing cleaner inheritance and typing than constructor parameters.

```typescript
import { Component, inject } from '@angular/core';

@Component({
  standalone: true,
  template: `<p>Logged in: {{ userService.getUser() }}</p>`
})
export class HeaderComponent {
  // Modern functional injection:
  protected userService = inject(UserService);
}
```

[Dependency Injection overview](https://angular.dev/guide/di) | [Injecting dependencies](https://angular.dev/guide/di/creating-injectable-service)

## Reactivity: Signals vs RxJS Observables

**1. Angular Signals (`signal`, `computed`, `effect`)**

Signals provide fine-grained reactivity with synchronous value access and glitch-free dependency tracking without manual subscription cleanup.

```typescript
import { Component, signal, computed, effect } from '@angular/core';

@Component({
  standalone: true,
  template: `<p>Total: {{ total() }}</p>`
})
export class CartComponent {
  count = signal(2);
  price = signal(100);
  // Computed signal updates automatically when dependencies change:
  total = computed(() => this.count() * this.price());

  constructor() {
    effect(() => {
      console.log(`Cart total changed to: ${this.total()}`);
    });
  }
}
```

**2. RxJS Observables and key operators**

Observables handle asynchronous streams and events over time. Essential operators:
- `map`: Transforms emitted stream values.
- `filter`: Emits only values that satisfy predicate.
- `switchMap`: Cancels previous inner Observable when a new outer item arrives (ideal for search-as-you-type).
- `catchError`: Intercepts failures and returns fallback stream.

```typescript
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap, catchError, of } from 'rxjs';

@Component({ /* ... */ })
export class SearchComponent {
  private http = inject(HttpClient);

  searchUsers(searchQuery$: Observable<string>) {
    return searchQuery$.pipe(
      switchMap((query) => this.http.get<User[]>(`/api/users?q=${query}`)),
      catchError((err) => {
        console.error(err);
        return of([]); // Return empty list on failure
      })
    );
  }
}
```

[Signals overview](https://angular.dev/guide/signals) | [RxJS interop](https://angular.dev/guide/signals/rxjs-interop)

## Tricky points

1. **Dependency Injection**
   **1.1 Component-level provider duplication:** Specifying a service in `@Component({ providers: [UserService] })` creates a new independent instance for that component and its children, breaking global singleton state.
   **1.2 Calling `inject()` outside injection context:** Calling `inject(Service)` inside regular methods or asynchronous callbacks throws `NG0203: inject() must be called from an injection context`. Call it during property declaration or in the `constructor`.

2. **Signals and Observables**
   **2.1 Missing signal execution parentheses in templates:** Calling `{{ total }}` renders the Signal function object itself; always invoke with parentheses `{{ total() }}` to read the reactive value.
   **2.2 Unsubscribed RxJS memory leaks:** Manually calling `.subscribe()` without destroying subscriptions causes memory leaks; use the `async` pipe, `toSignal()`, or `takeUntilDestroyed()`.