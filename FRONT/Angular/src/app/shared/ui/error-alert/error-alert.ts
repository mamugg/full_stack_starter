import { Component, input } from '@angular/core';
import { HlmAlertImports } from '@spartan-ng/helm/alert';

@Component({
  selector: 'app-error-alert',
  imports: [HlmAlertImports],
  templateUrl: './error-alert.html',
})
export class ErrorAlert {
  readonly message = input.required<string>();
}
