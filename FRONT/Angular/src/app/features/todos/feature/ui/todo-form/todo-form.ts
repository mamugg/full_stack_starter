import { Component, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';

@Component({
  selector: 'app-todo-form',
  imports: [ReactiveFormsModule, HlmButtonImports, HlmInput],
  templateUrl: './todo-form.html',
})
export class TodoForm {
  readonly created = output<string>();

  readonly title = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(200)],
  });

  submit(event: Event): void {
    // No `[formGroup]`/`FormsModule` here (a single `FormControl` doesn't need either),
    // so there's no `NgForm`/`FormGroupDirective` to wire up `(ngSubmit)` and call
    // `preventDefault()` for us — handle the native `submit` event directly instead.
    event.preventDefault();

    if (this.title.invalid) {
      this.title.markAsTouched();
      return;
    }

    this.created.emit(this.title.value.trim());
    this.title.reset('');
  }
}
