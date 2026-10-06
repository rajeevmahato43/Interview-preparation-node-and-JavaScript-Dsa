# Day 5: Forms, Validation, HttpClient, and Interceptors

Quick review of data collection and network communications in Angular. Covers Reactive Forms vs Template-Driven Forms, built-in validators, `HttpClient` requests, and functional HTTP interceptors for auth tokens.

## Reactive forms and validation

**1. Reactive forms architecture (`FormGroup`, `FormControl`, `Validators`)**

Reactive forms provide an explicit, type-safe, and immutable way of managing form state in TypeScript code rather than in template directives.

```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
      <input formControlName="email" placeholder="Email" />
      @if (userForm.get('email')?.invalid && userForm.get('email')?.touched) {
        <small class="error">Valid email is required.</small>
      }
      <button type="submit" [disabled]="userForm.invalid">Submit</button>
    </form>
  `
})
export class UserFormComponent {
  private fb = inject(FormBuilder);

  userForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['admin', Validators.required]
  });

  onSubmit() {
    if (this.userForm.valid) {
      console.log('Form values:', this.userForm.value);
    }
  }
}
```

**2. Form control state flags**

- `valid` vs `invalid`: Validity based on configured validators.
- `pristine` vs `dirty`: Has the user changed the input value?
- `untouched` vs `touched`: Has the input lost focus (`blur`)?

[Reactive forms](https://angular.dev/guide/forms/reactive-forms) | [Form validation](https://angular.dev/guide/forms/form-validation)

## HttpClient and functional HTTP interceptors

**1. `HttpClient` and backend requests**

Provide `HttpClient` via `provideHttpClient()` in `app.config.ts`. All methods (`get`, `post`, `put`, `delete`) return RxJS Observables that automatically parse JSON responses.

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Post { id: number; title: string; }

@Injectable({ providedIn: 'root' })
export class PostService {
  private http = inject(HttpClient);

  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>('/api/posts');
  }

  createPost(post: Partial<Post>): Observable<Post> {
    return this.http.post<Post>('/api/posts', post);
  }
}
```

**2. Functional HTTP Interceptor (`HttpInterceptorFn`)**

Intercept outgoing HTTP requests and incoming responses globally. Common use case: attaching JWT bearer tokens.

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (token) {
    const clonedReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(clonedReq);
  }
  return next(req);
};
```

[HttpClient overview](https://angular.dev/guide/http) | [HTTP Interceptors](https://angular.dev/guide/http/interceptors)

## Tricky points

1. **Forms and validation**
   **1.1 Cold Observable on HttpClient:** Calling `this.http.get('/api/users')` does not initiate an HTTP network request until `.subscribe()` is called or the `async` pipe is evaluated.
   **1.2 Modifying immutable HTTP requests:** `HttpRequest` objects in interceptors are immutable; attempting to mutate `req.headers.set(...)` directly fails. Always use `req.clone({ ... })`.

2. **Form control management**
   **2.1 Showing validation errors prematurely:** Checking only `userForm.get('field')?.invalid` shows red errors immediately on empty fields when the page loads; always combine with `.touched` or `.dirty`.
   **2.2 Disabled controls in `form.value`:** `form.value` excludes disabled controls from the resulting payload; call `form.getRawValue()` if you need values from disabled fields.