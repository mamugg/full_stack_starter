import { Component, input, output } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { Todo } from '../../../data-access/models/todo.model';

@Component({
  selector: 'app-todo-item',
  imports: [HlmButtonImports],
  templateUrl: './todo-item.html',
})
export class TodoItem {
  readonly todo = input.required<Todo>();

  readonly toggled = output<Todo>();
  readonly removed = output<number>();
}
