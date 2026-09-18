import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { Todo } from './models/todo.model';
import { TodoStore } from './todo.store';

const BASE_URL = 'https://api.test/api';

const sample: Todo = { id: 1, title: 'Ecrire la documentation', isDone: false, createdAt: '2026-01-01T00:00:00Z' };

function setup() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: BASE_URL }],
  });

  return { store: TestBed.inject(TodoStore), httpMock: TestBed.inject(HttpTestingController) };
}

describe('TodoStore', () => {
  it('loads the todo list', () => {
    const { store, httpMock } = setup();

    store.load();
    expect(store.loading()).toBe(true);

    httpMock.expectOne(`${BASE_URL}/todoitems`).flush([sample]);

    expect(store.loading()).toBe(false);
    expect(store.todos()).toEqual([sample]);
    expect(store.remainingCount()).toBe(1);

    httpMock.verify();
  });

  it('surfaces an error message when loading fails', () => {
    const { store, httpMock } = setup();

    store.load();
    httpMock.expectOne(`${BASE_URL}/todoitems`).flush(null, { status: 0, statusText: 'Unknown Error' });

    expect(store.loading()).toBe(false);
    expect(store.error()).toContain('Impossible de contacter le serveur');

    httpMock.verify();
  });

  it('appends a newly created todo', () => {
    const { store, httpMock } = setup();

    store.create('Nouvelle tâche');
    const req = httpMock.expectOne(`${BASE_URL}/todoitems`);
    expect(req.request.body).toEqual({ title: 'Nouvelle tâche' });
    req.flush({ id: 2, title: 'Nouvelle tâche', isDone: false, createdAt: '2026-01-02T00:00:00Z' });

    expect(store.todos()).toEqual([{ id: 2, title: 'Nouvelle tâche', isDone: false, createdAt: '2026-01-02T00:00:00Z' }]);

    httpMock.verify();
  });

  it('toggles a todo in place', () => {
    const { store, httpMock } = setup();
    store.load();
    httpMock.expectOne(`${BASE_URL}/todoitems`).flush([sample]);

    store.toggle(sample);
    const req = httpMock.expectOne(`${BASE_URL}/todoitems/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ title: sample.title, isDone: true });
    req.flush(null);

    expect(store.todos()[0].isDone).toBe(true);

    httpMock.verify();
  });

  it('removes a todo', () => {
    const { store, httpMock } = setup();
    store.load();
    httpMock.expectOne(`${BASE_URL}/todoitems`).flush([sample]);

    store.remove(1);
    httpMock.expectOne(`${BASE_URL}/todoitems/1`).flush(null);

    expect(store.todos()).toEqual([]);

    httpMock.verify();
  });
});
