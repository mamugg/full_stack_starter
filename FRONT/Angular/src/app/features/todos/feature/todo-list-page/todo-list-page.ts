import { Component, inject } from '@angular/core';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { TodoStore } from '../../data-access/todo.store';
import { Todo } from '../../data-access/models/todo.model';
import { ErrorAlert } from '../../../../shared/ui/error-alert/error-alert';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';
import { TodoForm } from '../ui/todo-form/todo-form';
import { TodoItem } from '../ui/todo-item/todo-item';

@Component({
  selector: 'app-todo-list-page',
  imports: [TodoForm, TodoItem, LoadingSpinner, ErrorAlert, HlmCardImports],
  templateUrl: './todo-list-page.html',
})
export class TodoListPage {
  protected readonly todoStore = inject(TodoStore);

  constructor() {
    this.todoStore.load();
  }

  onCreate(title: string): void {
    this.todoStore.create(title);
  }

  onToggle(todo: Todo): void {
    this.todoStore.toggle(todo);
  }

  onRemove(id: number): void {
    this.todoStore.remove(id);
  }
}
