# Day 3: Services, Dependency Injection, and Reactivity

## Services and DI

1. **Service:** Reusable class for shared behavior, state, or data access; keep UI rendering concerns in components.
2. **Dependency injection:** A component/service asks Angular for collaborators rather than constructing them directly; provider scope controls instance lifetime/sharing.
3. **Testing benefit:** Injected dependencies can be replaced with test doubles. [DI](https://angular.dev/guide/di) | [Services](https://angular.dev/guide/di/creating-and-using-services)

## Signals and RxJS vocabulary

1. **Signal:** A readable reactive value; `signal()` is writable, while `computed()` derives a read-only value from tracked inputs.
2. **Observable:** A stream that may emit over time; a Promise usually settles once. Subscriptions need a clear owner and cleanup.
3. **Interop:** Angular supports RxJS alongside signals; choose the project's established style rather than mixing state models casually. [Signals](https://angular.dev/guide/signals) | [RxJS interop](https://angular.dev/ecosystem/rxjs-interop)

## Tricky points

1. **Dependency injection**
	1.1 **Scope:** Component-level providers can create separate instances; root providers are typically shared application-wide.
	1.2 **Construction:** Avoid `new Service()` when the service depends on Angular DI-managed collaborators.
2. **Reactivity**
	2.1 **Signals:** A computed signal is derived/read-only; update its writable source rather than assigning to the computed value.
	2.2 **Subscriptions:** An unmanaged subscription can outlive its component; use async/template interop or clean it up.
	2.3 **Version:** Signals and APIs evolve; check the Angular version and project conventions.