import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TodoForm } from './todo-form';

describe('TodoForm', () => {
  async function createFixture() {
    await TestBed.configureTestingModule({ imports: [TodoForm] }).compileComponents();
    const fixture = TestBed.createComponent(TodoForm);
    fixture.detectChanges();
    return fixture;
  }

  it('emits the trimmed title and resets the field on submit', async () => {
    const fixture = await createFixture();
    const emitted: string[] = [];
    fixture.componentInstance.created.subscribe((value) => emitted.push(value));

    fixture.componentInstance.title.setValue('  Faire les courses  ');
    fixture.debugElement.query(By.css('form')).triggerEventHandler('submit', new Event('submit'));

    expect(emitted).toEqual(['Faire les courses']);
    expect(fixture.componentInstance.title.value).toBe('');
  });

  it('does not emit and marks the field as touched when empty', async () => {
    const fixture = await createFixture();
    const emitted: string[] = [];
    fixture.componentInstance.created.subscribe((value) => emitted.push(value));

    fixture.debugElement.query(By.css('form')).triggerEventHandler('submit', new Event('submit'));

    expect(emitted).toEqual([]);
    expect(fixture.componentInstance.title.touched).toBe(true);
  });
});
