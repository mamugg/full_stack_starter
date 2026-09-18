import { Component, input } from '@angular/core';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';

@Component({
  selector: 'app-loading-spinner',
  imports: [HlmSpinnerImports],
  templateUrl: './loading-spinner.html',
})
export class LoadingSpinner {
  readonly label = input('Chargement…');
}
