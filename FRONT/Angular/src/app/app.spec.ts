import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';

describe('App routing', () => {
  it('redirects an unauthenticated visitor from / to /login', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes, withComponentInputBinding()),
        { provide: AuthService, useValue: { isAuthenticated: signal(false), user: signal(null) } },
      ],
    });

    const harness = await RouterTestingHarness.create('/');

    expect(harness.routeDebugElement?.nativeElement.textContent).toContain('Connexion');
  });

  it('redirects an authenticated visitor from /login to /todos', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes, withComponentInputBinding()),
        {
          provide: AuthService,
          useValue: { isAuthenticated: signal(true), user: signal({ username: 'admin', role: 'Admin' }) },
        },
      ],
    });

    const harness = await RouterTestingHarness.create('/login');

    expect(harness.routeDebugElement?.nativeElement.textContent).toContain('Mes tâches');
  });
});
