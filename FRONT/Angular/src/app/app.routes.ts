import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { Shell } from './layout/shell/shell';
import { NotFoundPage } from './layout/not-found-page/not-found-page';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'todos' },
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPage),
        title: 'Connexion',
      },
      {
        path: 'todos',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/todos/feature/todo-list-page/todo-list-page').then((m) => m.TodoListPage),
        title: 'Mes tâches',
      },
      {
        path: 'posts',
        loadComponent: () =>
          import('./features/posts/feature/post-list-page/post-list-page').then((m) => m.PostListPage),
        title: 'Articles',
      },
      {
        path: 'posts/:id',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/posts/feature/post-detail-page/post-detail-page').then((m) => m.PostDetailPage),
        title: 'Article',
      },
      { path: '**', component: NotFoundPage },
    ],
  },
];
