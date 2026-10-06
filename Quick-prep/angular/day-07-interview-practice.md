# Day 7: Full-Feature Integration, Testing, and Angular Interview Synthesis

Quick review of end-to-end Angular development. Covers complete feature composition with modern Signals and Reactive Forms, testing with `TestBed`, version differences (v14–v18+), and backend developer collaboration.

## Full-feature architecture and backend contracts

**1. Production feature pattern with Signals and HttpClient**

Modern standalone component integrating Reactive Forms, Signals, OnPush change detection, and automatic unsubscription:

```typescript
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface Task { id: number; title: string; done: boolean; }

@Component({
  selector: 'app-task-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>Project Tasks</h2>
    <form [formGroup]="form" (ngSubmit)="createTask()">
      <input formControlName="title" placeholder="New task..." />
      <button type="submit" [disabled]="form.invalid">Add</button>
    </form>

    <ul>
      @for (task of tasks(); track task.id) {
        <li>{{ task.title }}</li>
      } @empty {
        <li>No active tasks.</li>
      }
    </ul>
  `
})
export class TaskDashboardComponent {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  tasks = signal<Task[]>([]);
  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]]
  });

  constructor() {
    this.http.get<Task[]>('/api/tasks')
      .pipe(takeUntilDestroyed())
      .subscribe((data) => this.tasks.set(data));
  }

  createTask() {
    if (this.form.invalid) return;
    const title = this.form.value.title!;
    this.http.post<Task>('/api/tasks', { title, done: false })
      .pipe(takeUntilDestroyed())
      .subscribe((newTask) => {
        this.tasks.update((prev) => [...prev, newTask]);
        this.form.reset();
      });
  }
}
```

**2. Angular testing basics with `TestBed`**

Configure isolated testing modules with mocked dependencies using `TestBed`:

```typescript
import { TestBed } from '@angular/core/testing';
import { TaskDashboardComponent } from './task-dashboard.component';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

describe('TaskDashboardComponent', () => {
  it('should initialize and load tasks', () => {
    const httpSpy = { get: jasmine.createSpy().and.returnValue(of([{ id: 1, title: 'Test Task' }])) };

    TestBed.configureTestingModule({
      imports: [TaskDashboardComponent],
      providers: [{ provide: HttpClient, useValue: httpSpy }]
    });

    const fixture = TestBed.createComponent(TaskDashboardComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.tasks().length).toBe(1);
  });
});
```

[Testing overview](https://angular.dev/guide/testing)

## Version evolution awareness for interviews

- **Angular 14–15:** Introduction of Standalone Components and functional routing guards.
- **Angular 16:** Introduction of Signals (`signal`, `computed`, `effect`) and `takeUntilDestroyed()`.
- **Angular 17:** Modern built-in template control flow (`@if`, `@for`, `@switch`), deferrable views (`@defer`).
- **Angular 18+:** Experimental Zoneless change detection, modern form events.

## Tricky points

1. **Full-stack coordination**
   **1.1 Strict TypeScript null checks:** Angular compiler checks template types strictly. Binding `{{ user.profile.bio }}` when `user` or `profile` can be null throws compilation errors; use the safe navigation operator `{{ user?.profile?.bio }}`.
   **1.2 CORS on credentials:** When passing session cookies or auth headers from an Angular frontend running on `localhost:4200` to a Node.js backend on `localhost:3000`, the backend must specify `credentials: true` and explicit origin (not wildcard `*`).

2. **Signals vs Observables interop**
   **2.1 `toSignal` without initial value:** Converting an asynchronous HTTP Observable with `toSignal(http$)` produces a signal with initial value `undefined`; initialize with `{ initialValue: [] }` to prevent template undefined access.
   **2.2 Zone.js versus Signals:** Signals provide reactivity, but Angular still utilizes Zone.js for triggering change detection passes unless explicitly configured in zoneless mode (`provideExperimentalZonelessChangeDetection()`).