import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <section class="not-found">
      <h1>404</h1>
      <p>Cette page n'existe pas.</p>
      <a routerLink="/todos">Retour à l'accueil</a>
    </section>
  `,
  styles: `
    .not-found {
      max-width: 30rem;
      margin: 4rem auto;
      text-align: center;
    }
  `,
})
export class NotFoundPage {}
