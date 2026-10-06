# Day 4: Routing, Navigation, Lazy Loading, and Route Guards

Quick review of Angular client-side routing. Covers Route configuration, `<router-outlet>`, route parameter binding, standalone lazy loading (`loadComponent`), and functional route guards (`canActivate`).

## Router setup, parameters, and lazy loading

**1. Route definitions and `<router-outlet>`**

Declare routes as an array of `Route` objects and provide them in `app.config.ts`. The `<router-outlet>` directive acts as a placeholder where the matched component renders.

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  {
    path: 'users',
    // Lazy loaded standalone component:
    loadComponent: () => import('./users/users.component').then(m => m.UsersComponent)
  },
  { path: 'users/:id', component: UserDetailComponent }
];
```

**2. Navigation with `routerLink`**

Navigate between views using the `routerLink` directive and highlight active links with `routerLinkActive`.

```html
<nav>
  <a routerLink="/dashboard" routerLinkActive="active-tab">Dashboard</a>
  <a [routerLink]="['/users', userId]" routerLinkActive="active-tab">Profile</a>
</nav>
<router-outlet />
```

**3. Reading route parameters**

Enable `withComponentInputBinding()` in `provideRouter(routes, withComponentInputBinding())` to automatically bind route parameters directly to component `@Input()` properties.

```typescript
import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  template: `<h3>Viewing User ID: {{ id }}</h3>`
})
export class UserDetailComponent {
  // Automatically populated from :id URL parameter:
  @Input() id!: string;
}
```

[Common routing tasks](https://angular.dev/guide/routing/common-router-tasks) | [Lazy loading](https://angular.dev/guide/routing/lazy-loading)

## Route guards and redirection

**1. Functional route guards (`canActivateFn`)**

Protect routes from unauthorized access using functional guards. Return a boolean, `UrlTree`, or an Observable/Promise resolving to one.

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }
  // Redirect unauthenticated user to login:
  return router.createUrlTree(['/login']);
};
```

**2. Attaching guards to routes**

```typescript
export const routes: Routes = [
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard]
  }
];
```

[Routing guards](https://angular.dev/guide/routing/prevent-unauthorized-access)

## Tricky points

1. **Route matching and paths**
   **1.1 Leading slash in route path:** Specifying `{ path: '/users' }` with a leading slash breaks routing; Angular route paths must omit the leading slash (e.g. `{ path: 'users' }`).
   **1.2 `pathMatch: 'full'` on empty paths:** Omitting `pathMatch: 'full'` on `{ path: '', redirectTo: 'home' }` matches *every* route prefix, causing endless redirection loops.

2. **Guards and navigation**
   **2.1 Guard returning false vs UrlTree:** Returning `false` simply cancels the current navigation without redirecting, leaving the user on a blank or unchanged screen; return `router.createUrlTree(['/login'])` to redirect explicitly.
   **2.2 Client-side guard limitation:** Route guards only protect client-side UI presentation; backend APIs must still authenticate and authorize every single request.