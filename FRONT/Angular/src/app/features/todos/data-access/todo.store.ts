import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { extractErrorMessage } from '../../../shared/utils/http-error';
import { Todo } from './models/todo.model';

interface TodoState {
  todos: Todo[];
  loading: boolean;
  error: string | null;
}

const initialState: TodoState = { todos: [], loading: false, error: null };

/**
 * NgRx SignalStore for the todos resource — the "shared/global state" example
 * of this starter (see `TodoService`'s former plain-signals version in git
 * history, and `PostListPage`'s `httpResource` for the read-only alternative).
 *
 * `load` uses `rxMethod` so a fresh call cancels a stale in-flight one
 * (`switchMap`); `create`/`toggle`/`remove` are plain methods since each call
 * is an independent, one-off mutation that should run to completion on its
 * own — nothing to cancel or switch away from.
 */
export const TodoStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ todos }) => ({
    remainingCount: computed(() => todos().filter((todo) => !todo.isDone).length),
  })),
  withMethods((store, http = inject(HttpClient), baseUrl = `${inject(API_BASE_URL)}/todoitems`) => ({
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          http.get<Todo[]>(baseUrl).pipe(
            tap((todos) => patchState(store, { todos, loading: false })),
            catchError((error: HttpErrorResponse) => {
              patchState(store, { error: extractErrorMessage(error), loading: false });
              return of(null);
            }),
          ),
        ),
      ),
    ),

    create(title: string): void {
      patchState(store, { error: null });

      http
        .post<Todo>(baseUrl, { title })
        .pipe(
          tap((created) => patchState(store, { todos: [...store.todos(), created] })),
          catchError((error: HttpErrorResponse) => {
            patchState(store, { error: extractErrorMessage(error) });
            return of(null);
          }),
        )
        .subscribe();
    },

    toggle(todo: Todo): void {
      patchState(store, { error: null });
      const updated: Todo = { ...todo, isDone: !todo.isDone };

      http
        .put<void>(`${baseUrl}/${todo.id}`, { title: updated.title, isDone: updated.isDone })
        .pipe(
          tap(() => patchState(store, { todos: store.todos().map((t) => (t.id === todo.id ? updated : t)) })),
          catchError((error: HttpErrorResponse) => {
            patchState(store, { error: extractErrorMessage(error) });
            return of(null);
          }),
        )
        .subscribe();
    },

    remove(id: number): void {
      patchState(store, { error: null });

      http
        .delete<void>(`${baseUrl}/${id}`)
        .pipe(
          tap(() => patchState(store, { todos: store.todos().filter((t) => t.id !== id) })),
          catchError((error: HttpErrorResponse) => {
            patchState(store, { error: extractErrorMessage(error) });
            return of(null);
          }),
        )
        .subscribe();
    },
  })),
);
