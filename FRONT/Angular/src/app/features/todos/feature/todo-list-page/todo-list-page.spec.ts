import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TodoStore } from '../../data-access/todo.store';
import { Todo } from '../../data-access/models/todo.model';
import { TodoListPage } from './todo-list-page';

const todos: Todo[] = [{ id: 1, title: 'Ecrire la documentation', isDone: false, createdAt: '2026-01-01T00:00:00Z' }];

function fakeTodoStore() {
  return {
    todos: signal(todos),
    loading: signal(false),
    error: signal<string | null>(null),
    remainingCount: signal(1),
    load: vi.fn(),
    create: vi.fn(),
    toggle: vi.fn(),
    remove: vi.fn(),
  };
}

describe('TodoListPage', () => {
  async function createFixture(store = fakeTodoStore()) {
    await TestBed.configureTestingModule({
      imports: [TodoListPage],
      providers: [{ provide: TodoStore, useValue: store }],
    }).compileComponents();
    const fixture = TestBed.createComponent(TodoListPage);
    fixture.detectChanges();
    return { fixture, store };
  }

  it('loads the todos on init', async () => {
    const { store } = await createFixture();
    expect(store.load).toHaveBeenCalledOnce();
  });

  it('renders the todo list and the remaining count', async () => {
    const { fixture } = await createFixture();
    expect(fixture.nativeElement.textContent).toContain('Ecrire la documentation');
    expect(fixture.nativeElement.textContent).toContain('1 tâche(s) restante(s) sur 1');
  });

  it('shows the error alert when the store reports one', async () => {
    const store = fakeTodoStore();
    store.error.set('Oups.');
    const { fixture } = await createFixture(store);

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('Oups.');
  });

  it('forwards a new todo title to the store', async () => {
    const { fixture, store } = await createFixture();

    fixture.componentInstance.onCreate('Nouvelle tâche');

    expect(store.create).toHaveBeenCalledWith('Nouvelle tâche');
  });

  it('forwards toggle and remove events from a todo-item', async () => {
    const { fixture, store } = await createFixture();

    fixture.debugElement.query(By.css('app-todo-item')).triggerEventHandler('toggled', todos[0]);
    fixture.debugElement.query(By.css('app-todo-item')).triggerEventHandler('removed', 1);

    expect(store.toggle).toHaveBeenCalledWith(todos[0]);
    expect(store.remove).toHaveBeenCalledWith(1);
  });
});
