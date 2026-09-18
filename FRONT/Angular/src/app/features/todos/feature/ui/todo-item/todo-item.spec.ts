import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Todo } from '../../../data-access/models/todo.model';
import { TodoItem } from './todo-item';

const todo: Todo = { id: 1, title: 'Ecrire la documentation', isDone: false, createdAt: '2026-01-01T00:00:00Z' };

describe('TodoItem', () => {
  async function createFixture() {
    await TestBed.configureTestingModule({ imports: [TodoItem] }).compileComponents();
    const fixture = TestBed.createComponent(TodoItem);
    fixture.componentRef.setInput('todo', todo);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the todo title', async () => {
    const fixture = await createFixture();
    expect(fixture.nativeElement.textContent).toContain('Ecrire la documentation');
  });

  it('emits toggled with the todo when the checkbox changes', async () => {
    const fixture = await createFixture();
    const emitted: Todo[] = [];
    fixture.componentInstance.toggled.subscribe((value) => emitted.push(value));

    fixture.debugElement.query(By.css('input[type="checkbox"]')).triggerEventHandler('change', {});

    expect(emitted).toEqual([todo]);
  });

  it('emits removed with the todo id when the delete button is clicked', async () => {
    const fixture = await createFixture();
    const emitted: number[] = [];
    fixture.componentInstance.removed.subscribe((value) => emitted.push(value));

    fixture.debugElement.query(By.css('button[aria-label="Supprimer"]')).triggerEventHandler('click', {});

    expect(emitted).toEqual([1]);
  });
});
